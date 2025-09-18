// Panel JavaScript for Killer AI Extension
console.log('Killer AI Panel loaded');

// Panel state
let currentState = 'welcome';
let currentData = null;
let settings = null;

// DOM elements
const elements = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    questionSection: document.getElementById('questionSection'),
    loadingSection: document.getElementById('loadingSection'),
    responseSection: document.getElementById('responseSection'),
    errorSection: document.getElementById('errorSection'),
    actionButtons: document.getElementById('actionButtons'),
    responseActions: document.getElementById('responseActions'),
    
    questionText: document.getElementById('questionText'),
    loadingText: document.getElementById('loadingText'),
    responseLabel: document.getElementById('responseLabel'),
    responseMeta: document.getElementById('responseMeta'),
    responseContent: document.getElementById('responseContent'),
    errorMessage: document.getElementById('errorMessage'),
    
    // Buttons
    closeBtn: document.getElementById('closeBtn'),
    minimizeBtn: document.getElementById('minimizeBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    explainBtn: document.getElementById('explainBtn'),
    answerBtn: document.getElementById('answerBtn'),
    copyBtn: document.getElementById('copyBtn'),
    newBtn: document.getElementById('newBtn'),
    retryBtn: document.getElementById('retryBtn'),
    
    // Settings modal
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    endpointInput: document.getElementById('endpointInput')
};

// Initialize panel
initializePanel();

function initializePanel() {
    setupEventListeners();
    loadSettings();
    showWelcomeScreen();
    
    // Notify parent that panel is ready
    window.parent.postMessage({ type: 'panelReady' }, '*');
}

function setupEventListeners() {
    // Header buttons
    elements.closeBtn.addEventListener('click', closePanel);
    elements.minimizeBtn.addEventListener('click', minimizePanel);
    elements.settingsBtn.addEventListener('click', openSettings);
    
    // Action buttons
    elements.explainBtn.addEventListener('click', () => handleAction('explain'));
    elements.answerBtn.addEventListener('click', () => handleAction('answer'));
    
    // Response actions
    elements.copyBtn.addEventListener('click', copyResponse);
    elements.newBtn.addEventListener('click', newQuestion);
    elements.retryBtn.addEventListener('click', retryRequest);
    
    // Settings modal
    elements.closeSettingsBtn.addEventListener('click', closeSettings);
    elements.cancelSettingsBtn.addEventListener('click', closeSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Settings modal backdrop click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });
    
    // Listen for messages from parent window
    window.addEventListener('message', handleParentMessage);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
}

function handleParentMessage(event) {
    const { type, data } = event.data;
    console.log('Panel received message:', type);
    
    switch (type) {
        case 'showLoading':
            showLoading(data.mode, data.text);
            break;
        case 'showResponse':
            showResponse(data);
            break;
        case 'showError':
            showError(data.error);
            break;
    }
}

function handleKeyDown(event) {
    // Escape key closes panel or settings
    if (event.key === 'Escape') {
        if (!elements.settingsModal.classList.contains('hidden')) {
            closeSettings();
        } else {
            closePanel();
        }
    }
    
    // Ctrl+Enter for quick actions
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (currentData?.text && currentState !== 'loading') {
            handleAction('answer');
        }
    }
}

// State management functions
function showWelcomeScreen() {
    hideAllSections();
    elements.welcomeScreen.classList.remove('hidden');
    elements.actionButtons.classList.add('hidden');
    elements.responseActions.classList.add('hidden');
    currentState = 'welcome';
}

function showQuestion(text) {
    elements.questionText.textContent = text;
    elements.questionSection.classList.remove('hidden');
    elements.questionSection.classList.add('fade-in');
}

function showLoading(mode, text) {
    currentData = { mode, text };
    
    hideAllSections();
    showQuestion(text);
    
    elements.loadingSection.classList.remove('hidden');
    elements.loadingSection.classList.add('fade-in');
    elements.actionButtons.classList.add('hidden');
    elements.responseActions.classList.add('hidden');
    
    const modeText = mode === 'explain' ? 'Generating explanation...' : 'Finding answer...';
    elements.loadingText.textContent = modeText;
    
    currentState = 'loading';
}

function showResponse(data) {
    const { mode, text, response, cached, timestamp } = data;
    currentData = { mode, text, response, cached, timestamp };
    
    hideAllSections();
    showQuestion(text);
    
    elements.responseSection.classList.remove('hidden');
    elements.responseSection.classList.add('fade-in');
    elements.actionButtons.classList.add('hidden');
    elements.responseActions.classList.remove('hidden');
    
    // Update response header
    const modeLabel = mode === 'explain' ? 'Explanation' : 'Answer';
    elements.responseLabel.textContent = modeLabel;
    
    // Update meta information
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const cachedStr = cached ? ' • cached' : '';
    elements.responseMeta.textContent = `${timeStr}${cachedStr}`;
    
    // Update response content with formatting
    elements.responseContent.innerHTML = formatResponse(response);
    
    currentState = 'response';
}

function showError(error) {
    hideAllSections();
    
    if (currentData?.text) {
        showQuestion(currentData.text);
    }
    
    elements.errorSection.classList.remove('hidden');
    elements.errorSection.classList.add('fade-in');
    elements.actionButtons.classList.remove('hidden');
    elements.responseActions.classList.add('hidden');
    
    elements.errorMessage.textContent = error;
    
    currentState = 'error';
}

function hideAllSections() {
    elements.welcomeScreen.classList.add('hidden');
    elements.loadingSection.classList.add('hidden');
    elements.responseSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
}

// Action handlers
function handleAction(mode) {
    if (!currentData?.text) return;
    
    // Send action request to parent
    window.parent.postMessage({
        type: 'actionRequest',
        data: { mode, text: currentData.text }
    }, '*');
}

function copyResponse() {
    if (!currentData?.response) return;
    
    // Send copy request to parent
    window.parent.postMessage({
        type: 'copyText',
        data: { text: currentData.response }
    }, '*');
    
    // Show feedback
    const originalText = elements.copyBtn.innerHTML;
    elements.copyBtn.innerHTML = '<span class="btn-icon">✅</span><span>Copied!</span>';
    elements.copyBtn.disabled = true;
    
    setTimeout(() => {
        elements.copyBtn.innerHTML = originalText;
        elements.copyBtn.disabled = false;
    }, 2000);
}

function newQuestion() {
    showWelcomeScreen();
    currentData = null;
}

function retryRequest() {
    if (!currentData?.text) return;
    
    const mode = currentData.mode || 'answer';
    showLoading(mode, currentData.text);
    
    // Send retry request to parent
    window.parent.postMessage({
        type: 'actionRequest',
        data: { mode, text: currentData.text }
    }, '*');
}

function closePanel() {
    window.parent.postMessage({ type: 'closePanel' }, '*');
}

function minimizePanel() {
    // For now, just close the panel
    closePanel();
}

// Settings functions
async function loadSettings() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'getSettings' });
        settings = response;
    } catch (error) {
        console.error('Failed to load settings:', error);
        settings = {
            google_api_key: '',
            google_api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
        };
    }
}

function openSettings() {
    if (settings) {
        elements.apiKeyInput.value = settings.google_api_key || '';
        elements.endpointInput.value = settings.google_api_endpoint || '';
    }
    
    elements.settingsModal.classList.remove('hidden');
    elements.settingsModal.classList.add('fade-in');
    elements.apiKeyInput.focus();
}

function closeSettings() {
    elements.settingsModal.classList.add('hidden');
}

async function saveSettings() {
    const newSettings = {
        google_api_key: elements.apiKeyInput.value.trim(),
        google_api_endpoint: elements.endpointInput.value.trim()
    };
    
    try {
        await chrome.runtime.sendMessage({
            type: 'saveSettings',
            settings: newSettings
        });
        
        settings = newSettings;
        closeSettings();
        
        // Show success feedback
        showNotification('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

// Utility functions
function formatResponse(text) {
    if (!text) return '';
    
    // Convert line breaks to HTML
    let formatted = text.replace(/\n/g, '<br>');
    
    // Bold text between **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text between *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks between `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Truncate extremely long responses
    if (formatted.length > 5000) {
        formatted = formatted.substring(0, 5000) + '... <em>(truncated)</em>';
    }
    
    return formatted;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
    });
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Sanitize text input for security
function sanitizeText(text) {
    if (!text) return '';
    
    // Remove potentially dangerous characters
    return text
        .replace(/[<>]/g, '')
        .substring(0, 10000) // Limit length
        .trim();
}

// Handle panel visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Panel became visible');
    }
});

// Initialize panel state
console.log('Panel initialized successfully');