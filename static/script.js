// Global variables
let currentTab = 'document';
let currentResults = null;

// DOM elements
const elements = {
    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    documentTab: document.getElementById('document-tab'),
    csvTab: document.getElementById('csv-tab'),
    
    // Document elements
    docUrl: document.getElementById('doc-url'),
    chunkSize: document.getElementById('chunk-size'),
    chunkOverlap: document.getElementById('chunk-overlap'),
    chunkSizeValue: document.getElementById('chunk-size-value'),
    chunkOverlapValue: document.getElementById('chunk-overlap-value'),
    initializeBtn: document.getElementById('initialize-btn'),
    systemStatus: document.getElementById('system-status'),
    docsCount: document.getElementById('docs-count'),
    chunksCount: document.getElementById('chunks-count'),
    systemStatusText: document.getElementById('system-status-text'),
    docQuestion: document.getElementById('doc-question'),
    askDocBtn: document.getElementById('ask-doc-btn'),
    docChatContainer: document.getElementById('doc-chat-container'),
    
    // CSV elements
    csvFile: document.getElementById('csv-file'),
    uploadArea: document.getElementById('upload-area'),
    csvInfo: document.getElementById('csv-info'),
    csvRows: document.getElementById('csv-rows'),
    csvColumns: document.getElementById('csv-columns'),
    schemaGrid: document.getElementById('schema-grid'),
    previewTable: document.getElementById('preview-table'),
    csvInputSection: document.getElementById('csv-input-section'),
    csvQuestion: document.getElementById('csv-question'),
    analyzeCsvBtn: document.getElementById('analyze-csv-btn'),
    csvChatContainer: document.getElementById('csv-chat-container'),
    
    // Common elements
    modelSelect: document.getElementById('model-select'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text'),
    toastContainer: document.getElementById('toast-container'),
    
    // Modal elements
    resultsModalOverlay: document.getElementById('results-modal-overlay'),
    resultsModal: document.getElementById('results-modal'),
    closeResultsModal: document.getElementById('close-results-modal'),
    modalResultsCount: document.getElementById('modal-results-count'),
    resultsTable: document.getElementById('results-table'),
    downloadResultsBtn: document.getElementById('download-results-btn')
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateSliderValues();
});

// Event listeners
function initializeEventListeners() {
    // Tab switching
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Slider updates
    elements.chunkSize.addEventListener('input', updateSliderValues);
    elements.chunkOverlap.addEventListener('input', updateSliderValues);
    
    // Document system
    elements.initializeBtn.addEventListener('click', initializeDocumentSystem);
    elements.askDocBtn.addEventListener('click', askDocumentQuestion);
    elements.docQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') askDocumentQuestion();
    });
    
    // CSV system
    elements.uploadArea.addEventListener('click', () => elements.csvFile.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('drop', handleFileDrop);
    elements.csvFile.addEventListener('change', handleFileUpload);
    elements.analyzeCsvBtn.addEventListener('click', analyzeCsvData);
    elements.csvQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeCsvData();
    });
    
    // Common actions
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Modal
    elements.closeResultsModal.addEventListener('click', closeResultsModal);
    elements.resultsModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.resultsModalOverlay) closeResultsModal();
    });
    elements.downloadResultsBtn.addEventListener('click', downloadResults);
}

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    elements.documentTab.classList.toggle('active', tabName === 'document');
    elements.csvTab.classList.toggle('active', tabName === 'csv');
}

// Slider value updates
function updateSliderValues() {
    elements.chunkSizeValue.textContent = elements.chunkSize.value;
    elements.chunkOverlapValue.textContent = elements.chunkOverlap.value;
}

// Document System Functions
async function initializeDocumentSystem() {
    const docUrl = elements.docUrl.value;
    const chunkSize = elements.chunkSize.value;
    const chunkOverlap = elements.chunkOverlap.value;
    
    if (!docUrl) {
        showToast('Please enter a document URL', 'error');
        return;
    }
    
    showLoading('Initializing AI system...');
    elements.initializeBtn.disabled = true;
    
    try {
        const response = await fetch('/api/initialize-docs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doc_url: docUrl,
                chunk_size: chunkSize,
                chunk_overlap: chunkOverlap
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update system status
            elements.docsCount.textContent = data.stats.documents_loaded;
            elements.chunksCount.textContent = data.stats.chunks_created;
            elements.systemStatusText.textContent = data.stats.status;
            elements.systemStatus.style.display = 'block';

            // Enable document Q&A inputs
            elements.docQuestion.disabled = false;
            elements.askDocBtn.disabled = false;

            // Clear document chat area to fresh welcome
            clearDocumentChat();

            showToast('System initialized successfully!', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast(`Error initializing system: ${error.message}`, 'error');
    } finally {
        hideLoading();
        elements.initializeBtn.disabled = false;
    }
}

// Loading and toast functions
function showLoading(text = 'Loading...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.add('show');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('show');
}

function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fas fa-info-circle';
    let title = 'Info';
    
    if (type === 'success') {
        icon = 'fas fa-check-circle';
        title = 'Success';
    } else if (type === 'error') {
        icon = 'fas fa-exclamation-circle';
        title = 'Error';
    }
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="removeToast(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            removeToast(toast.querySelector('.toast-close'));
        }
    }, duration);
}

function removeToast(button) {
    const toast = button.closest('.toast');
    if (toast) {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Add slideOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

async function askDocumentQuestion() {
    const question = elements.docQuestion.value.trim();
    const model = elements.modelSelect.value;
    
    if (!question) {
        showToast('Please enter a question', 'error');
        return;
    }
    
    showLoading('AI is thinking...');
    elements.askDocBtn.disabled = true;
    
    try {
        const response = await fetch('/api/ask-document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                model: model
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add messages to chat
            addDocumentMessage(question, 'user');
            addDocumentMessage(data.answer, 'assistant', data.context, data.response_time);
            
            // Clear input
            elements.docQuestion.value = '';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
        elements.askDocBtn.disabled = false;
    }
}

function addDocumentMessage(content, role, context = null, responseTime = null) {
    const chatContainer = elements.docChatContainer;
    
    // Remove welcome message if it exists
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="user-message">
                <div class="message-header">
                    <strong>You</strong>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${content}</div>
            </div>
        `;
    } else {
        const enhancedContent = enhanceResponseContent(content, 'document');
        let contextHtml = '';
        
        if (context && context.length > 0) {
            contextHtml = `
                <div class="context-expander">
                    <button class="expander-btn" onclick="toggleContext(this)">
                        <i class="fas fa-chevron-down"></i>
                        View ${context.length} relevant document chunks
                    </button>
                    <div class="context-content">
                        ${context.map((chunk, index) => `
                            <div class="document-chunk">
                                <strong>Chunk ${index + 1}:</strong><br>
                                ${chunk.substring(0, 300)}${chunk.length > 300 ? '...' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="ai-message">
                <div class="message-header">
                    <strong>🤖 AI Assistant</strong>
                    <span>Response time: ${responseTime?.toFixed(2)}s | ${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${enhancedContent}</div>
                ${contextHtml}
            </div>
        `;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearDocumentChat() {
    elements.docChatContainer.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-robot"></i>
            <h3>Ready to Answer Your Questions!</h3>
            <p>Ask anything about your documents.</p>
        </div>
    `;
}

// CSV System Functions
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast('Please upload a CSV file', 'error');
        return;
    }
    
    showLoading('Processing CSV file...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCsvInfo(data.schema, data.preview);
            showToast('CSV file loaded successfully!', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function displayCsvInfo(schema, preview) {
    // Update stats
    elements.csvRows.textContent = schema.row_count;
    elements.csvColumns.textContent = schema.column_count;
    
    // Display schema
    elements.schemaGrid.innerHTML = schema.columns.map(col => `
        <div class="schema-item">
            <h4>${col}</h4>
            <div class="type">${schema.data_types[col]}</div>
            <div class="samples">
                ${schema.sample_values[col].length > 0 
                    ? 'Examples: ' + schema.sample_values[col].slice(0, 2).join(', ')
                    : 'No data'}
            </div>
        </div>
    `).join('');
    
    // Display preview
    if (preview.length > 0) {
        const columns = Object.keys(preview[0]);
        elements.previewTable.innerHTML = `
            <thead>
                <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${preview.map(row => `
                    <tr>${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        `;
    }
    
    // Show sections
    elements.csvInfo.style.display = 'block';
    elements.csvInputSection.style.display = 'block';
    
    // Clear chat
    clearCsvChat();
}

async function analyzeCsvData() {
    const question = elements.csvQuestion.value.trim();
    const model = elements.modelSelect.value;
    
    if (!question) {
        showToast('Please enter a question', 'error');
        return;
    }
    
    showLoading('Analyzing data...');
    elements.analyzeCsvBtn.disabled = true;
    
    try {
        const response = await fetch('/api/analyze-csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                model: model
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add messages to chat
            addCsvMessage(question, 'user');
            addCsvMessage(data.explanation, 'assistant', data.sql_query, data.results, data.results_count);
            
            // Store results for modal
            currentResults = data.results;
            
            // Clear input
            elements.csvQuestion.value = '';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
        elements.analyzeCsvBtn.disabled = false;
    }
}

function addCsvMessage(content, role, sqlQuery = null, results = null, resultsCount = null) {
    const chatContainer = elements.csvChatContainer;
    
    // Remove welcome message if it exists
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="user-message">
                <div class="message-header">
                    <strong>You</strong>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${content}</div>
            </div>
        `;
    } else {
        const enhancedContent = enhanceResponseContent(content, 'csv');
        let sqlHtml = '';
        let resultsHtml = '';
        
        if (sqlQuery) {
            sqlHtml = `
                <div class="context-expander">
                    <button class="expander-btn" onclick="toggleContext(this)">
                        <i class="fas fa-code"></i>
                        View Generated SQL
                    </button>
                    <div class="context-content">
                        <div class="code-block">${sqlQuery}</div>
                    </div>
                </div>
            `;
        }
        
        if (results && results.length > 0) {
            resultsHtml = `
                <div class="context-expander">
                    <button class="expander-btn" onclick="showResults(${JSON.stringify(results).replace(/"/g, '&quot;')}, ${resultsCount})">
                        <i class="fas fa-table"></i>
                        View Results (${resultsCount} rows)
                    </button>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="ai-message">
                <div class="message-header">
                    <strong>🤖 AI Assistant</strong>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${enhancedContent}</div>
                ${sqlHtml}
                ${resultsHtml}
            </div>
        `;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearCsvChat() {
    elements.csvChatContainer.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-chart-bar"></i>
            <h3>Ready to Analyze Your Data!</h3>
            <p>Ask questions about your CSV data in natural language.</p>
        </div>
    `;
}

// Utility Functions
function enhanceResponseContent(content, type) {
    // Clean and enhance the response content
    let enhanced = content.replace(/\n/g, '<br>');
    
    // Highlight numbers
    enhanced = enhanced.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="highlighted-number">$1</span>');
    
    // Create structured response for CSV
    if (type === 'csv') {
        // If it's a short response, create a single word answer
        const words = content.trim().split(/\s+/);
        if (words.length <= 3) {
            return `
                <div class="single-word-container">
                    <div class="single-word-answer">🎯 ${content}</div>
                </div>
                <div class="insight-box">
                    <h4><i class="fas fa-lightbulb"></i> Key Insight</h4>
                    <p>This is the direct answer to your question based on your data analysis.</p>
                </div>
            `;
        }
        
        // For longer responses, create structured sections
        return `
            <div class="response-container">
                <div class="response-header">
                    <h4><i class="fas fa-chart-bar"></i> Analysis Results</h4>
                </div>
                <div class="response-content">
                    ${enhanced}
                </div>
                <div class="insight-box">
                    <h4><i class="fas fa-lightbulb"></i> Key Takeaway</h4>
                    <p>Analysis completed successfully with clear insights and actionable data.</p>
                </div>
            </div>
        `;
    }
    
    // For document responses
    return `
        <div class="response-container">
            <div class="response-header">
                <h4><i class="fas fa-book"></i> Answer</h4>
            </div>
            <div class="response-content">
                ${enhanced}
            </div>
            <div class="insight-box">
                <h4><i class="fas fa-book-open"></i> Source</h4>
                <p>This information was extracted from your uploaded documents.</p>
            </div>
        </div>
    `;
}

function toggleContext(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        icon.className = 'fas fa-chevron-down';
    } else {
        content.classList.add('open');
        icon.className = 'fas fa-chevron-up';
    }
}

function showResults(results, count) {
    if (!results || results.length === 0) {
        showToast('No results to display', 'error');
        return;
    }
    
    currentResults = results;
    
    // Update modal content
    elements.modalResultsCount.textContent = `${count} rows`;
    
    // Create table
    const columns = Object.keys(results[0]);
    elements.resultsTable.innerHTML = `
        <thead>
            <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
        </thead>
        <tbody>
            ${results.map(row => `
                <tr>${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}</tr>
            `).join('')}
        </tbody>
    `;
    
    // Show modal
    elements.resultsModalOverlay.classList.add('show');
}

function closeResultsModal() {
    elements.resultsModalOverlay.classList.remove('show');
}

async function downloadResults() {
    if (!currentResults) {
        showToast('No results to download', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/download-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                results: currentResults
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analysis_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Results downloaded successfully!', 'success');
        } else {
            throw new Error('Download failed');
        }
    } catch (error) {
        showToast(`Error downloading results: ${error.message}`, 'error');
    }
}

async function clearHistory() {
    try {
        showLoading('Clearing history...');
        const response = await fetch('/api/clear-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: currentTab
            })
        });

        const data = await response.json();

        if (data.success) {
            if (currentTab === 'document') {
                clearDocumentChat();
            } else if (currentTab === 'csv') {
                clearCsvChat();
            }
            showToast('History cleared successfully!', 'success');
        } else {
            throw new Error('Failed to clear history');
        }
    } catch (error) {
        showToast(`Error clearing history: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}