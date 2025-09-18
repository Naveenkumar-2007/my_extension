// Content script for Killer AI extension - Universal Browser & Exam Site Support
console.log('🚀 Killer AI content script loaded on:', window.location.href);
console.log('🔒 Enhanced permissions active - All browsers & exam sites supported');

// Force visibility check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM loaded, extension ready');
  });
} else {
  console.log('📋 DOM already loaded, extension ready');
}

let floatingToolbar = null;
let currentSelection = '';
let lastRequestTime = 0;
let panel = null;

// Detect exam environment
const isExamEnvironment = () => {
  const url = window.location.href.toLowerCase();
  const body = document.body?.className?.toLowerCase() || '';
  const examKeywords = [
    'exam', 'test', 'quiz', 'assessment', 'proctorio', 'lockdown', 
    'respondus', 'honorlock', 'examity', 'examsoft', 'canvas', 
    'blackboard', 'moodle', 'brightspace', 'schoology', 'pearson',
    'mcgraw', 'cengage', 'wiley', 'webassign', 'mylab', 'connect'
  ];
  
  return examKeywords.some(keyword => 
    url.includes(keyword) || body.includes(keyword) || 
    document.title.toLowerCase().includes(keyword)
  );
};

const examMode = isExamEnvironment();
if (examMode) {
  console.log('🎓 Exam environment detected - Enhanced stealth mode active');
  document.body.setAttribute('data-killer-exam', 'true');
}

// Add a test indicator to show extension is loaded
setTimeout(() => {
  if (document.body) {
    const testDiv = document.createElement('div');
    testDiv.id = 'killer-test-indicator';
    testDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: #4CAF50;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 999999;
      opacity: 0.8;
    `;
    testDiv.textContent = 'Killer AI Loaded ✓';
    document.body.appendChild(testDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (testDiv.parentNode) {
        testDiv.remove();
      }
    }, 3000);
    
    console.log('🔧 Test indicator added');
  }
}, 1000);

// Initialize content script with exam site bypass
initializeContentScript();

// Bypass common exam site restrictions
function bypassExamRestrictions() {
  if (examMode) {
    console.log('🔓 Bypassing exam site restrictions...');
    
    // Override common blocking methods
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // Allow our extension events but block some exam monitoring
      if (type === 'contextmenu' || type === 'keydown' || type === 'copy') {
        const isKillerEvent = listener && listener.toString().includes('killer');
        if (isKillerEvent) {
          return originalAddEventListener.call(this, type, listener, options);
        }
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Override console blocking
    const originalLog = console.log;
    console.log = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('🚀 Killer')) {
        return originalLog.apply(console, args);
      }
      return originalLog.apply(console, args);
    };
    
    // Override clipboard restrictions
    const originalExecCommand = document.execCommand;
    document.execCommand = function(command, showUI, value) {
      if (command === 'copy' && currentSelection) {
        return true; // Allow our extension to copy
      }
      return originalExecCommand.call(document, command, showUI, value);
    };
  }
}

function initializeContentScript() {
  // Check if chrome.runtime is available
  if (!chrome || !chrome.runtime) {
    console.error('❌ Chrome extension API not available');
    return;
  }
  
  // Check if extension context is still valid
  try {
    if (chrome.runtime.id) {
      console.log('✅ Chrome extension API available, extension ID:', chrome.runtime.id);
    }
  } catch (error) {
    console.error('❌ Extension context invalidated, reloading page...');
    // Silently fail and wait for page reload
    return;
  }
  
  bypassExamRestrictions();
  setupSelectionHandlers();
  setupKeyboardHandlers();
  setupMessageHandlers();  
}

// Set up text selection handlers
function setupSelectionHandlers() {
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('selectionchange', handleSelectionChange);
  document.addEventListener('scroll', hideFloatingToolbar);
  document.addEventListener('click', handleDocumentClick);
}

function handleMouseUp(event) {
  console.log('🖱️ Mouse up event detected at:', event.pageX, event.pageY);
  
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('🖱️ Selected text length:', selectedText.length);
    console.log('🖱️ Selected text:', selectedText ? `"${selectedText}"` : 'none');
    
    if (selectedText && selectedText.length > 0) {
      currentSelection = selectedText;
      console.log('📍 Showing floating toolbar at:', event.pageX, event.pageY);
      console.log('📍 Current selection set to:', currentSelection);
      showFloatingToolbar(event.pageX, event.pageY);
    } else {
      console.log('📍 No text selected, hiding toolbar');
      hideFloatingToolbar();
    }
  }, 10);
}

function handleSelectionChange() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    currentSelection = '';
    hideFloatingToolbar();
  }
}

function handleDocumentClick(event) {
  // Hide toolbar if clicking outside of it
  if (floatingToolbar && !floatingToolbar.contains(event.target)) {
    const selection = window.getSelection();
    if (!selection.toString().trim()) {
      hideFloatingToolbar();
    }
  }
}

// Create and show floating toolbar
function showFloatingToolbar(x, y) {
  console.log('🔧 Creating floating toolbar at position:', x, y);
  console.log('🔧 Extension context valid:', isExtensionContextValid());
  hideFloatingToolbar(); // Remove existing toolbar
  
  floatingToolbar = document.createElement('div');
  floatingToolbar.id = 'killer-floating-toolbar';
  floatingToolbar.innerHTML = `
    <button class="killer-toolbar-btn killer-explain-btn" data-action="explain">
      <span class="killer-btn-icon">📖</span>
      <span>Explain</span>
    </button>
    <button class="killer-toolbar-btn killer-answer-btn" data-action="answer">
      <span class="killer-btn-icon">💡</span>
      <span>Answer</span>
    </button>
  `;
  
  // Add styles with enhanced compatibility
  const zIndex = examMode ? '999999999' : '2147483647';
  const opacity = examMode ? '0.95' : '1';
  const scale = examMode ? 'scale(0.85)' : 'scale(1)';
  
  floatingToolbar.style.cssText = `
    position: fixed !important;
    display: flex;
    gap: 4px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
    padding: 4px;
    z-index: ${zIndex};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    border: 1px solid #e1e5e9;
    opacity: ${opacity};
    transform: ${scale};
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color-scheme: light;
    all: initial;
    box-sizing: border-box;
  `;
  
  // Add force visibility class for problematic sites
  floatingToolbar.classList.add('killer-force-visible');
  
  // Style buttons
  const buttons = floatingToolbar.querySelectorAll('.killer-toolbar-btn');
  buttons.forEach(btn => {
    btn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 6px 8px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8f9fa;
      color: #495057;
    `;
    
    if (btn.dataset.action === 'explain') {
      btn.style.background = '#28a745';
      btn.style.color = 'white';
    } else {
      btn.style.background = '#17a2b8';
      btn.style.color = 'white';
    }
    
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Prevent any other click handlers
      console.log('🎯 Toolbar button clicked:', btn.dataset.action);
      handleToolbarAction(btn.dataset.action);
    });
  });
  
  // Position toolbar
  const rect = document.body.getBoundingClientRect();
  const toolbarWidth = 160; // Estimated width (smaller)
  const toolbarHeight = 34; // Estimated height (smaller)
  
  let left = x - toolbarWidth / 2;
  let top = y - toolbarHeight - 10;
  
  // Keep toolbar within viewport
  if (left < 10) left = 10;
  if (left + toolbarWidth > window.innerWidth - 10) {
    left = window.innerWidth - toolbarWidth - 10;
  }
  if (top < 10) top = y + 10;
  
  floatingToolbar.style.left = `${left}px`;
  floatingToolbar.style.top = `${top}px`;
  
  document.body.appendChild(floatingToolbar);
  console.log('🔧 Floating toolbar added to body');
  
  // Add fade-in animation
  floatingToolbar.style.opacity = '0';
  floatingToolbar.style.transform = 'translateY(5px)';
  requestAnimationFrame(() => {
    floatingToolbar.style.transition = 'opacity 0.2s, transform 0.2s';
    floatingToolbar.style.opacity = '1';
    floatingToolbar.style.transform = 'translateY(0)';
    console.log('🔧 Floating toolbar animation complete');
  });
}

function hideFloatingToolbar() {
  if (floatingToolbar) {
    floatingToolbar.remove();
    floatingToolbar = null;
  }
}

// Handle toolbar button clicks
function handleToolbarAction(action) {
  console.log('⚡ Toolbar action triggered:', action, 'with text:', currentSelection);
  
  if (!currentSelection) {
    console.error('❌ No text selected');
    return;
  }
  
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    showSmallTooltip('Extension needs to be reloaded. Please refresh the page.', 'error');
    return;
  }
  
  // Debounce requests
  const now = Date.now();
  if (now - lastRequestTime < 300) {
    console.log('⏸️ Request debounced');
    return;
  }
  lastRequestTime = now;

  hideFloatingToolbar();
  
  console.log('📤 Sending message to background script');
  
  // Send request to background script with error handling and retry
  const sendWithRetry = (retryCount = 0) => {
    sendMessageSafely({
      type: 'req',
      mode: action,
      text: currentSelection
    }, () => {
      console.log('✅ Message sent successfully');
    }, (error) => {
      console.error('❌ Failed to send message to background:', error);
      
      if (error.message && error.message.includes('Extension context invalidated')) {
        showSmallTooltip('Extension was reloaded. Please refresh the page to continue.', 'error');
      } else if (retryCount < 2) {
        console.log(`🔄 Retrying request (attempt ${retryCount + 1})`);
        setTimeout(() => sendWithRetry(retryCount + 1), 1000);
      } else {
        showSmallTooltip('Failed to connect to AI service after retries. Please try again.', 'error');
      }
    });
  };
  
  sendWithRetry();
  
  // Show small loading tooltip immediately
  console.log('🔄 Showing loading tooltip');
  showSmallTooltip('Getting AI response...', 'loading');
}

// Set up keyboard handlers for Ctrl+C
function setupKeyboardHandlers() {
  document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(event) {
  // Detect Ctrl+C (or Cmd+C on Mac)
  const isCopyShortcut = (event.ctrlKey || event.metaKey) && event.key === 'c';
  
  if (isCopyShortcut) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('📋 Ctrl+C detected, selected text:', selectedText ? `"${selectedText}"` : 'none');
    
    if (selectedText) {
      // Allow native copy to proceed
      setTimeout(() => {
        // Debounce requests
        const now = Date.now();
        if (now - lastRequestTime < 300) {
          console.log('⏸️ Ctrl+C request debounced');
          return;
        }
        lastRequestTime = now;
        
        currentSelection = selectedText;
        
        console.log('📤 Sending Ctrl+C answer request to background');
        
        // Check if extension context is still valid
        if (!isExtensionContextValid()) {
          showSmallTooltip('Extension needs to be reloaded. Please refresh the page.', 'error');
          return;
        }
        
        // Send answer request to background script with error handling
        sendMessageSafely({
          type: 'req',
          mode: 'answer',
          text: selectedText
        }, () => {
          console.log('✅ Ctrl+C message sent successfully');
        }, (error) => {
          console.error('❌ Failed to send Ctrl+C message to background:', error);
          if (error.message && error.message.includes('Extension context invalidated')) {
            showSmallTooltip('Extension was reloaded. Please refresh the page to continue.', 'error');
          } else {
            showSmallTooltip('Failed to connect to AI service. Try again.', 'error');
          }
        });
        
        // Show small loading tooltip immediately
        console.log('🔄 Showing loading tooltip for Ctrl+C');
        showSmallTooltip('Getting AI answer...', 'loading');
      }, 50);
    }
  }
}

// Set up message handlers for background script responses
function setupMessageHandlers() {
  if (!isExtensionContextValid()) {
    console.log('⚠️ Extension context invalid, skipping message handler setup');
    return;
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received message:', message.type, message);
    
    try {
      switch (message.type) {
        case 'response':
          if (message.response && message.response.trim()) {
            console.log('✅ Displaying AI response:', message.response.substring(0, 100) + '...');
            
            // Determine response type based on quota status
            let responseType = 'success';
            if (message.fallback) {
              responseType = 'warning'; // Special type for fallback responses
            } else if (message.quotaInfo && message.quotaInfo.showWarning) {
              responseType = 'success-warning'; // Success but with quota warning
            }
            
            showSmallTooltip(message.response, responseType, message.quotaInfo);
          } else {
            console.log('⚠️ Empty response received');
            showSmallTooltip('Empty response received. Please try again.', 'error');
          }
          break;
        case 'error':
          console.log('❌ Displaying error:', message.error);
          showSmallTooltip(message.error || 'Unknown error occurred', 'error');
          break;
        default:
          console.log('⚠️ Unknown message type:', message.type);
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  });
}

// Mini chat interface management - PERMANENT DISPLAY
let currentTooltip = null;
let chatCounter = 0;

function showSmallTooltip(message, type = 'info', quotaInfo = null) {
  console.log('💬 Creating PERMANENT mini chat interface:', type, message);
  
  // Only remove loading tooltip when showing actual answer
  if (currentTooltip && currentTooltip.className.includes('loading') && type !== 'loading') {
    hideSmallTooltip();
  }
  
  chatCounter++;
  currentTooltip = document.createElement('div');
  currentTooltip.id = `killer-ai-chat-${chatCounter}`;
  currentTooltip.className = `killer-chat-${type}`;
  
  // Create mini chat interface based on type
  if (type === 'loading') {
    createLoadingChat(message);
  } else {
    createAnswerChat(message, type, quotaInfo);
  }
}

// Create loading chat interface
function createLoadingChat(message) {
  // Calculate position to avoid overlapping with existing chats
  const existingChats = document.querySelectorAll('[id^="killer-ai-chat-"]');
  const topOffset = 20 + (existingChats.length * 340);
  
  currentTooltip.style.cssText = `
    position: fixed;
    top: ${topOffset}px;
    right: 20px;
    width: 300px;
    background: #ffffff;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 2147483647;
    overflow: hidden;
  `;
  
  currentTooltip.innerHTML = `
    <div style="
      background: #f8f9fa;
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      "></div>
      <span style="font-size: 13px; font-weight: 500; color: #495057;">
        ${message}
      </span>
    </div>
  `;
  
  // Add CSS animation for loading indicator
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  if (!document.querySelector('#killer-chat-styles')) {
    style.id = 'killer-chat-styles';
    document.head.appendChild(style);
  }
  
  document.body.appendChild(currentTooltip);
  
  // Loading tooltip will be replaced when actual answer arrives - no auto-hide timer
}

// Create answer chat interface (mini chat style) - PERMANENT
function createAnswerChat(message, type, quotaInfo) {
  // Determine colors and icons based on type
  let headerColor, icon, buttonColor;
  switch (type) {
    case 'success':
      headerColor = '#10b981';
      icon = '🤖';
      buttonColor = '#059669';
      break;
    case 'success-warning':
      headerColor = '#f59e0b';
      icon = '⚠️';
      buttonColor = '#d97706';
      break;
    case 'warning':
      headerColor = '#f59e0b';
      icon = '📚';
      buttonColor = '#d97706';
      break;
    case 'error':
      headerColor = '#ef4444';
      icon = '❌';
      buttonColor = '#dc2626';
      break;
    default:
      headerColor = '#6b7280';
      icon = 'ℹ️';
      buttonColor = '#4b5563';
  }
  
  // Calculate position to avoid overlapping with existing chats
  const existingChats = document.querySelectorAll('[id^="killer-ai-chat-"]');
  const topOffset = examMode ? 10 + (existingChats.length * 300) : 20 + (existingChats.length * 340);
  const zIndex = examMode ? '999999999' : '2147483647';
  const chatOpacity = examMode ? '0.95' : '1';
  const chatScale = examMode ? 'scale(0.9)' : 'scale(1)';
  
  currentTooltip.style.cssText = `
    position: fixed !important;
    top: ${topOffset}px;
    right: ${examMode ? '10px' : '20px'};
    width: ${examMode ? '280px' : '320px'};
    max-width: 90vw;
    background: #ffffff;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    z-index: ${zIndex};
    overflow: hidden;
    opacity: ${chatOpacity};
    transform: ${chatScale};
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color-scheme: light;
    all: initial;
    box-sizing: border-box;
  `;
  
  // Add force visibility class
  currentTooltip.classList.add('killer-force-visible');
  
  // Add quota information if available
  let quotaDisplay = '';
  if (quotaInfo) {
    if (quotaInfo.exhausted) {
      quotaDisplay = '<div style="margin-top: 8px; padding: 6px 8px; background: #fee2e2; border-radius: 6px; font-size: 11px; color: #dc2626;">📊 Daily quota exhausted (0/50)</div>';
    } else if (quotaInfo.showWarning) {
      quotaDisplay = `<div style="margin-top: 8px; padding: 6px 8px; background: #fef3c7; border-radius: 6px; font-size: 11px; color: #d97706;">⚠️ ${quotaInfo.remaining}/${quotaInfo.total} requests remaining</div>`;
    }
  }
  
  currentTooltip.innerHTML = `
    <div style="
      background: ${headerColor};
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${icon}</span>
        <span style="font-size: 13px; font-weight: 600;">Killer AI</span>
        <span style="font-size: 10px; opacity: 0.8; margin-left: 4px;">• Auto-close</span>
      </div>
      <button id="close-chat-btn" style="
        width: 20px;
        height: 20px;
        border: none;
        background: rgba(255,255,255,0.2);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
        ✕
      </button>
    </div>
    <div style="padding: 16px;">
      <div style="
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        font-size: 13px;
        line-height: 1.4;
        color: #495057;
        max-height: 200px;
        overflow-y: auto;
      ">
        ${message}
        ${quotaDisplay}
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="copy-answer-btn" style="
          flex: 1;
          background: ${buttonColor};
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          📋 Copy
        </button>
        <button id="close-answer-btn" style="
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Close
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(currentTooltip);
  
  // Add event listeners for buttons
  const closeBtn = currentTooltip.querySelector('#close-chat-btn');
  const copyBtn = currentTooltip.querySelector('#copy-answer-btn');
  const closeAnswerBtn = currentTooltip.querySelector('#close-answer-btn');
  
  const chatElement = currentTooltip; // Capture reference to this specific chat
  
  // Add click-outside-to-close functionality
  const handleOutsideClick = (e) => {
    if (!chatElement.contains(e.target)) {
      console.log('🖱️ Clicked outside chat, closing automatically');
      hideSpecificChat(chatElement);
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  
  // Add the outside click listener after a short delay to prevent immediate closing
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
  
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('click', handleOutsideClick);
    hideSpecificChat(chatElement);
  });
  
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(message);
    copyBtn.innerHTML = '✅ Copied!';
    setTimeout(() => {
      if (copyBtn) copyBtn.innerHTML = '📋 Copy';
    }, 2000);
  });
  
  closeAnswerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('click', handleOutsideClick);
    hideSpecificChat(chatElement);
  });
  
  // Make chat interface PERMANENT - only manual close allowed
  console.log('🔒 PERMANENT answer chat created - will stay visible until manually closed');
  
  // NO automatic closing, NO click-outside handlers, NO timeouts
  // User must manually click close buttons to remove
}

function hideSmallTooltip() {
  if (currentTooltip) {
    hideSpecificChat(currentTooltip);
    currentTooltip = null;
  }
}

function hideSpecificChat(chatElement) {
  if (chatElement) {
    console.log('🔒 Hiding specific chat interface:', chatElement.id);
    
    // Animate out
    chatElement.style.opacity = '0';
    chatElement.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      if (chatElement && chatElement.parentNode) {
        chatElement.remove();
        
        // Reposition remaining chats to fill gaps
        repositionChats();
      }
    }, 200);
  }
}

function repositionChats() {
  const remainingChats = document.querySelectorAll('[id^="killer-ai-chat-"]');
  remainingChats.forEach((chat, index) => {
    const topOffset = 20 + (index * 340);
    chat.style.top = `${topOffset}px`;
  });
}

// Utility function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy text:', error);
    showNotification('Failed to copy text', 'error');
  }
}

// Show notification function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 300px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 500;
    z-index: 2147483647;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  });
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(20px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Utility functions for extension context management
function isExtensionContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (error) {
    console.warn('Extension context check failed:', error);
    return false;
  }
}

function sendMessageSafely(message, onSuccess, onError) {
  try {
    if (!isExtensionContextValid()) {
      onError(new Error('Extension context invalidated'));
      return;
    }
    
    chrome.runtime.sendMessage(message)
      .then(onSuccess)
      .catch(onError);
  } catch (error) {
    onError(error);
  }
}