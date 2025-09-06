# 📊🧠 Dyaan Assistant

Dyaan Assistant is a **full-stack AI-powered assistant** that helps you:

1. Analyze **CSV data** by automatically generating and executing SQL queries.
2. Explore **documentation sites** by loading, chunking, embedding, and answering questions contextually.

👉 **Live Demo:** [Dyaan Assistant on Render](https://dyann-ai-assistant.onrender.com)

---

## 🚀 Features

✅ **CSV Analysis**

* Upload CSV files and auto-detect schema (columns, data types, sample values).
* Ask natural language questions → get **automatically generated SQL queries**.
* SQL executed on the fly using **DuckDB**.
* Clear **human-friendly explanations** of query results.
* Download results as CSV.

✅ **Documentation Q\&A**

* Load any documentation website (default: [LangChain docs](https://docs.smith.langchain.com/)).
* Chunk and embed docs with **SentenceTransformers + FAISS**.
* Ask context-aware questions about the docs.
* Get fast and accurate AI-powered answers with citations.

✅ **Session Management**

* Keeps **chat/analysis history** for both CSV and docs.
* Option to **clear history** anytime.

---

## 🛠️ Tech Stack

* **Backend**: Flask, Flask-CORS
* **Data Handling**: Pandas, DuckDB
* **AI/LLM**: LangChain, ChatGroq, SentenceTransformers
* **Vector Store**: FAISS
* **Environment Management**: python-dotenv
* **Other**: werkzeug, regex, datetime

---

## ⚙️ Installation (Local Setup)

### 1️⃣ Clone the repo

```bash
git clone https://github.com/yourusername/dyaan-assistant.git
cd dyaan-assistant
```

### 2️⃣ Create virtual environment

```bash
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows
```

### 3️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Set up environment variables

Create a `.env` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5️⃣ Run the server

```bash
python app.py
```

Server will start at:
👉 `http://localhost:5000`

Or use the deployed version directly at:
👉 [https://dyann-ai-assistant.onrender.com](https://dyann-ai-assistant.onrender.com)

---

## 📡 API Endpoints

### 🔹 CSV APIs

* `POST /api/upload-csv` → Upload CSV file
* `POST /api/analyze-csv` → Ask a question about CSV data
* `POST /api/download-results` → Download analysis results
* `GET /api/get-chat-history` → Get CSV + Docs history
* `POST /api/clear-history` → Clear chat/analysis history

### 🔹 Document APIs

* `POST /api/initialize-docs` → Load docs from URL
* `POST /api/ask-document` → Ask a question from loaded docs

---

## 📂 Project Structure

```
dyaan-assistant/
│── app.py              # Main Flask application
│── templates/
│   └── index.html      # Frontend (basic UI)
│── requirements.txt    # Python dependencies
│── README.md           # Documentation
│── .env                # API keys
```

---

## 🎯 Example Usage

### 1️⃣ CSV Analysis

1. Upload a CSV file.
2. Ask: *“What is the average sales per region?”*
3. Assistant generates SQL:

   ```sql
   SELECT "Region", AVG("Sales") AS avg_sales
   FROM csv_data
   GROUP BY "Region";
   ```
4. Results + Explanation returned.

### 2️⃣ Docs Q\&A

1. Initialize docs with:

   ```json
   { "doc_url": "https://docs.smith.langchain.com/" }
   ```
2. Ask: *“What is LangChain used for?”*
3. Assistant retrieves context chunks and returns a precise answer.

---

## 📌 Future Improvements

* Add support for **Excel/JSON/Parquet** files.
* Enable **multi-file document embeddings**.
* Build **React frontend** for better UI.
* Extend SQL generation to **multiple databases**.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to change.

---

## 📜 License

MIT License © 2025 Your Name

---

