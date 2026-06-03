from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import pandas as pd
import duckdb
from langchain_groq import ChatGroq
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains import create_retrieval_chain
from langchain_community.vectorstores import FAISS
import time
from datetime import datetime
import json
import io
import re
import html
from werkzeug.utils import secure_filename
from sentence_transformers import SentenceTransformer

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global variables for document processing
doc_system = {
    'initialized': False,
    'embeddings': None,
    'vectors': None,
    'docs': [],
    'final_documents': [],
    'chat_history': []
}

# Global variables for CSV processing
csv_system = {
    'data': None,
    'schema': None,
    'analysis_history': []
}

class SentenceTransformerWrapper:
    def __init__(self, model_name):
        self.model = SentenceTransformer(model_name)
    
    def __call__(self, texts):
        if isinstance(texts, str):
            return self.embed_query(texts)
        else:
            return self.embed_documents(texts)
    
    def embed_documents(self, texts):
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
    
    def embed_query(self, text):
        embedding = self.model.encode([text])
        return embedding[0].tolist()

def detect_csv_schema(df):
    """Detect and return CSV schema information"""
    schema_info = {
        "columns": [],
        "data_types": {},
        "sample_values": {},
        "row_count": len(df),
        "column_count": len(df.columns)
    }
    
    for col in df.columns:
        dtype = str(df[col].dtype)
        sample_vals = df[col].dropna().head(3).tolist()
        
        schema_info["columns"].append(col)
        schema_info["data_types"][col] = dtype
        schema_info["sample_values"][col] = sample_vals
    
    return schema_info

def generate_sql_with_llm(schema_info, user_question, groq_api_key, model_name):
    """Generate SQL query using LLM based on schema and user question"""
    try:
        llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model_name
        )
        
        prompt = ChatPromptTemplate.from_template("""
        You are an expert SQL developer. Given the following CSV schema and user question, generate a valid SQL query.
        
        CRITICAL: The CSV data is loaded into a DuckDB table named 'csv_data'. You MUST use 'csv_data' as the table name.
        
        CSV Schema:
        - Table name: csv_data
        - Number of rows: {row_count}
        - Number of columns: {column_count}
        - Columns: {columns}
        - Data types: {data_types}
        - Sample values: {sample_values}
        
        User Question: {user_question}
        
        Instructions:
        1. Generate ONLY the SQL query, no explanations
        2. You MUST use 'csv_data' as the table name
        3. Use standard SQL syntax compatible with DuckDB
        4. Handle column names that might contain spaces by using double quotes
        5. Use appropriate SQL functions for the analysis requested
        
        SQL Query:
        """)
        
        response = llm.invoke(prompt.format(
            row_count=schema_info["row_count"],
            column_count=schema_info["column_count"],
            columns=schema_info["columns"],
            data_types=schema_info["data_types"],
            sample_values=schema_info["sample_values"],
            user_question=user_question
        ))
        
        sql_query = response.content.strip()
        
        # Clean up SQL query
        if sql_query.startswith("```sql"):
            sql_query = sql_query.split("```sql")[1]
        if sql_query.endswith("```"):
            sql_query = sql_query.rsplit("```", 1)[0]
        
        sql_query = sql_query.strip()
        
        # Fix table names
        incorrect_table_names = ['your_table', 'data', 'table', 'csv', 'dataset', 'the_table']
        for incorrect_name in incorrect_table_names:
            sql_query = sql_query.replace(f'FROM {incorrect_name}', 'FROM csv_data')
            sql_query = sql_query.replace(f'from {incorrect_name}', 'FROM csv_data')
        
        sql_query = re.sub(r'FROM\s+(\w+)', 'FROM csv_data', sql_query, flags=re.IGNORECASE)
        
        return sql_query
        
    except Exception as e:
        print(f"Error generating SQL: {str(e)}")
        return None

def execute_sql_on_csv(df, sql_query):
    """Execute SQL query on CSV data using DuckDB"""
    try:
        con = duckdb.connect(database=':memory:')
        con.register('csv_data', df)
        
        result = con.execute(sql_query)
        
        if result.description:
            columns = [desc[0] for desc in result.description]
            data = result.fetchall()
            result_df = pd.DataFrame(data, columns=columns)
        else:
            result_df = pd.DataFrame({"message": ["Query executed successfully"]})
        
        con.close()
        return result_df, None
        
    except Exception as e:
        return None, str(e)

def explain_results(sql_query, results_df, user_question):
    """Generate explanation of results using LLM"""
    try:
        groq_api_key = os.environ['GROQ_API_KEY']
        llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name="llama-3.1-8b-instant"
        )
        
        results_summary = f"""
        Query: {sql_query}
        Results: {len(results_df)} rows returned
        Columns: {list(results_df.columns)}
        Sample data: {results_df.head(3).to_dict()}
        """
        
        prompt = ChatPromptTemplate.from_template("""
        You are a data analyst. Explain SQL query results in simple, human-friendly language.
        
        User Question: {user_question}
        SQL Query: {sql_query}
        Results Summary: {results_summary}
        
        Provide a clear explanation with:
        1. What the query does (in plain English)
        2. What the results mean
        3. Key insights from the data
        
        Be concise and avoid technical jargon.
        """)
        
        response = llm.invoke(prompt.format(
            user_question=user_question,
            sql_query=sql_query,
            results_summary=results_summary
        ))
        
        return response.content.strip()
        
    except Exception as e:
        return f"Unable to generate explanation: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/initialize-docs', methods=['POST'])
def initialize_docs():
    try:
        data = request.json
        doc_url = data.get('doc_url', 'https://docs.smith.langchain.com/')
        chunk_size = int(data.get('chunk_size', 1000))
        chunk_overlap = int(data.get('chunk_overlap', 200))
        
        # Initialize embeddings
        doc_system['embeddings'] = SentenceTransformerWrapper('all-MiniLM-L6-v2')
        
        # Load documents
        loader = WebBaseLoader(doc_url)
        doc_system['docs'] = loader.load()
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        doc_system['final_documents'] = text_splitter.split_documents(
            doc_system['docs'][:50]
        )
        
        # Create vector store
        doc_system['vectors'] = FAISS.from_documents(
            doc_system['final_documents'],
            doc_system['embeddings']
        )
        
        doc_system['initialized'] = True
        doc_system['chat_history'] = []
        
        return jsonify({
            'success': True,
            'stats': {
                'documents_loaded': len(doc_system['docs']),
                'chunks_created': len(doc_system['final_documents']),
                'status': 'Ready'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ask-document', methods=['POST'])
def ask_document():
    try:
        if not doc_system['initialized']:
            return jsonify({'success': False, 'error': 'Document system not initialized'}), 400
        
        data = request.json
        user_input = data.get('question', '')
        model_name = data.get('model', 'llama-3.1-8b-instant')
        
        if not user_input:
            return jsonify({'success': False, 'error': 'Question is required'}), 400
        
        groq_api_key = os.environ['GROQ_API_KEY']
        llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model_name
        )
        
        prompt = ChatPromptTemplate.from_template("""
        You are a helpful AI assistant. Answer the user's question based on the provided context only.
        If the context doesn't contain enough information, say so clearly.
        
        Context: {context}
        
        Question: {input}
        
        Please provide a clear, accurate, and helpful response based on the context.
        """)
        
        document_chain = create_stuff_documents_chain(llm, prompt)
        retriever = doc_system['vectors'].as_retriever()
        retrieval_chain = create_retrieval_chain(retriever, document_chain)
        
        start_time = time.time()
        response = retrieval_chain.invoke({"input": user_input})
        response_time = time.time() - start_time
        
        # Add to chat history
        doc_system['chat_history'].append({
            "role": "user",
            "content": user_input,
            "timestamp": datetime.now().isoformat()
        })
        
        doc_system['chat_history'].append({
            "role": "assistant",
            "content": response['answer'],
            "context": [doc.page_content for doc in response["context"]],
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'answer': response['answer'],
            'context': [doc.page_content for doc in response["context"]],
            'response_time': response_time,
            'chat_history': doc_system['chat_history']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'success': False, 'error': 'Please upload a CSV file'}), 400
        
        # Read CSV file
        df = pd.read_csv(file)
        csv_system['data'] = df
        
        # Auto-detect schema
        schema_info = detect_csv_schema(df)
        csv_system['schema'] = schema_info
        csv_system['analysis_history'] = []
        
        return jsonify({
            'success': True,
            'schema': schema_info,
            'preview': df.head(10).to_dict('records')
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze-csv', methods=['POST'])
def analyze_csv():
    try:
        if csv_system['data'] is None:
            return jsonify({'success': False, 'error': 'No CSV data loaded'}), 400
        
        data = request.json
        question = data.get('question', '')
        model_name = data.get('model', 'llama-3.1-8b-instant')
        
        if not question:
            return jsonify({'success': False, 'error': 'Question is required'}), 400
        
        groq_api_key = os.environ['GROQ_API_KEY']
        
        # Generate SQL query
        sql_query = generate_sql_with_llm(
            csv_system['schema'],
            question,
            groq_api_key,
            model_name
        )
        
        if not sql_query:
            return jsonify({'success': False, 'error': 'Failed to generate SQL query'}), 500
        
        # Execute SQL on CSV
        results_df, error = execute_sql_on_csv(csv_system['data'], sql_query)
        
        if results_df is None:
            return jsonify({'success': False, 'error': f'SQL execution error: {error}'}), 500
        
        # Generate explanation
        explanation = explain_results(sql_query, results_df, question)
        
        # Add to analysis history
        csv_system['analysis_history'].append({
            "role": "user",
            "content": question,
            "timestamp": datetime.now().isoformat()
        })
        
        csv_system['analysis_history'].append({
            "role": "assistant",
            "content": explanation,
            "sql_query": sql_query,
            "results": results_df.to_dict('records'),
            "timestamp": datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'explanation': explanation,
            'sql_query': sql_query,
            'results': results_df.to_dict('records'),
            'results_count': len(results_df),
            'analysis_history': csv_system['analysis_history']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download-results', methods=['POST'])
def download_results():
    try:
        data = request.json
        results = data.get('results', [])
        
        if not results:
            return jsonify({'success': False, 'error': 'No results to download'}), 400
        
        df = pd.DataFrame(results)
        
        # Create CSV in memory
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        # Convert to BytesIO for Flask send_file
        mem = io.BytesIO()
        mem.write(output.getvalue().encode())
        mem.seek(0)
        
        filename = f"analysis_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return send_file(
            mem,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get-chat-history')
def get_chat_history():
    return jsonify({
        'document_history': doc_system['chat_history'],
        'csv_history': csv_system['analysis_history']
    })

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    data = request.json
    history_type = data.get('type', 'both')
    
    if history_type in ['document', 'both']:
        doc_system['chat_history'] = []
    
    if history_type in ['csv', 'both']:
        csv_system['analysis_history'] = []
    
    return jsonify({'success': True})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)