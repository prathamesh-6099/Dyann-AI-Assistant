# � QueryMind

A powerful AI-powered web application built with Flask that enables intelligent document analysis and CSV data exploration using natural language queries.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)
![LangChain](https://img.shields.io/badge/LangChain-Powered-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### 📚 Document Analysis (RAG)
- **Web Document Loading**: Load and process documents from any URL
- **Intelligent Chunking**: Configurable chunk size and overlap for optimal context
- **Vector Search**: FAISS-powered semantic search for relevant document retrieval
- **Contextual Q&A**: Ask questions and get AI-generated answers based on document content

### 📊 CSV Analysis with Natural Language
- **Auto Schema Detection**: Automatically detects column types and sample values
- **Natural Language to SQL**: Convert plain English questions to SQL queries using LLM
- **DuckDB Execution**: Fast in-memory SQL execution on your CSV data
- **Smart Explanations**: AI-generated explanations of query results
- **Export Results**: Download analysis results as CSV files

### 🎨 Modern UI/UX
- **Animated Interface**: Smooth animations and visual effects
- **Glassmorphism Design**: Modern glass-effect styling
- **Responsive Layout**: Works on desktop and mobile devices
- **Real-time Feedback**: Typing indicators and loading animations
- **Dark Theme**: Eye-friendly dark color scheme

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Backend** | Flask, Python 3.10+ |
| **AI/ML** | LangChain, Groq LLM, Sentence Transformers |
| **Vector Store** | FAISS |
| **Database** | DuckDB (in-memory SQL) |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Embeddings** | all-MiniLM-L6-v2 |

## 📁 Project Structure

```
querymind/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (API keys)
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── static/
│   ├── style.css         # Styles with animations
│   └── script.js         # Frontend JavaScript
├── templates/
│   └── index.html        # Main HTML template
└── myenv/                # Virtual environment
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- Groq API Key ([Get one here](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd querymind
   ```

2. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv myenv
   .\myenv\Scripts\activate

   # Linux/Mac
   python -m venv myenv
   source myenv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open in browser**
   ```
   http://localhost:5000
   ```

## ☁️ Deploying to Render

You can easily deploy **QueryMind** to [Render](https://render.com/) as a Python Web Service.

### Step-by-Step Deployment Guide

1. **Prerequisites**:
   - Create a free account on [Render](https://render.com/).
   - Push your code to a GitHub, GitLab, or Bitbucket repository.

2. **Create a New Web Service**:
   - In the Render Dashboard, click **New +** and select **Web Service**.
   - Connect your GitHub repository containing this project.

3. **Configure Settings**:
   - **Name**: `querymind` (or any name you prefer)
   - **Region**: Choose the region closest to you (e.g., `Singapore`, `Oregon`, `Frankfurt`)
   - **Branch**: `main` (or your production branch)
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app` (Render automatically binds to the `$PORT` environment variable)

4. **Add Environment Variables**:
   - Click the **Advanced** button or go to the **Environment** tab.
   - Click **Add Environment Variable** to configure the following keys:
     - `GROQ_API_KEY`: Your Groq API key (Required)
     - `USER_AGENT`: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36` (Required for LangChain's `WebBaseLoader` to function correctly without being blocked by websites)
     - `PYTHON_VERSION`: `3.12.0` (Recommended)

5. **Deploy**:
   - Click **Deploy Web Service**.
   - Render will build the environment and launch the Flask application. Once successful, you will receive a public URL (e.g., `https://querymind.onrender.com`).

## 📖 Usage Guide

### Document Analysis

1. **Enter Document URL**: Paste the URL of the webpage/document you want to analyze
2. **Configure Settings**: Adjust chunk size (500-2000) and overlap (100-500)
3. **Initialize System**: Click "Initialize System" to load and process the document
4. **Ask Questions**: Type your questions about the document content

### CSV Analysis

1. **Upload CSV**: Click the upload area or drag & drop your CSV file
2. **Review Schema**: Check the auto-detected columns and data types
3. **Preview Data**: View the first few rows of your data
4. **Ask Questions**: Type natural language questions like:
   - "Show me the top 5 sales by region"
   - "What's the average age of customers?"
   - "Count rows where status is 'active'"
5. **View Results**: See the generated SQL, results, and AI explanation
6. **Download**: Export results as CSV

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main application page |
| `/api/initialize-docs` | POST | Initialize document system |
| `/api/ask-document` | POST | Ask question about documents |
| `/api/upload-csv` | POST | Upload CSV file |
| `/api/analyze-csv` | POST | Analyze CSV with natural language |
| `/api/download-results` | POST | Download analysis results |
| `/api/get-chat-history` | GET | Get conversation history |
| `/api/clear-history` | POST | Clear chat history |

## ⚙️ Configuration

### Available LLM Models

| Model | Description |
|-------|-------------|
| `llama-3.1-8b-instant` | Fast, efficient responses (default) |
| `llama-3.3-70b-versatile` | More capable, detailed responses |
| `llama3-groq-8b-8192-tool-use-preview` | Optimized for tool use |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Your Groq API key |
| `USER_AGENT` | No | Custom user agent for web requests |

## 🎨 UI Features

- **Animated Gradient Header**: Dynamic color-shifting background
- **Floating Particles**: Ambient particle effects
- **Glow Effects**: Pulsing glow on interactive elements
- **Typing Indicators**: Visual feedback during AI processing
- **Slide Animations**: Smooth message transitions
- **3D Card Effects**: Interactive hover states
- **Custom Cursor Glow**: Follows mouse movement

## 🔒 Security Notes

- API keys are stored in `.env` (not committed to git)
- File uploads limited to 16MB
- Only CSV files accepted for data analysis
- Input sanitization for SQL queries

## 🐛 Troubleshooting

### Common Issues

1. **Model Decommissioned Error**
   - Update model names in `app.py` and `index.html`
   - Check [Groq Docs](https://console.groq.com/docs/models) for current models

2. **GROQ_API_KEY Not Found**
   - Ensure `.env` file exists with valid API key
   - Restart the Flask server after adding the key

3. **Document Loading Fails**
   - Check if the URL is accessible
   - Some sites block web scraping

4. **CSV Upload Fails**
   - Ensure file is valid CSV format
   - Check file size is under 16MB

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Powered by PRATHAM** 🚀

---

<p align="center">
  Made with ❤️ using Flask & LangChain
</p>
