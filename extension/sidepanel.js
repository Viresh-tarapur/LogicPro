document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const captureBtn = document.getElementById('capture-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const historyBtn = document.getElementById('history-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const studyToolsBtn = document.getElementById('study-tools-btn');
    const chatContainer = document.getElementById('chat-container');

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset to re-calculate
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });

    // Send on Enter (without shift)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);

    captureBtn.addEventListener('click', async () => {
        try {
            // Check permissions/context
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                addMessage('Error: No active tab found.', 'ai-message');
                return;
            }

            // Capture visible tab
            const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

            // Add image to chat as preview
            addMessage('User provided a screenshot.', 'user-message', dataUrl);

            // Send to backend
            await sendToBackend(null, dataUrl);

        } catch (err) {
            console.error('Capture error:', err);
            addMessage('Error capturing screenshot: ' + err.message, 'ai-message');
        }
    });

    // Clear Chat
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the chat?')) {
            // Keep the first greeting message if possible, or just clear all and re-add greeting
            chatContainer.innerHTML = '<div class="message ai-message">Hello! Is there any question I can help you with?</div>';
        }
    });

    // Placeholders for future features
    if (historyBtn) historyBtn.addEventListener('click', () => alert('History feature coming soon!'));
    if (uploadBtn) uploadBtn.addEventListener('click', () => alert('Image upload coming soon!'));
    if (studyToolsBtn) studyToolsBtn.addEventListener('click', () => alert('Study tools menu coming soon!'));

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user-message');
        userInput.value = '';
        userInput.style.height = 'auto';

        await sendToBackend(text, null);
    }

    function addMessage(text, className, imageUrl = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${className}`;

        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.marginBottom = '8px';
            msgDiv.appendChild(img);
        }

        // Simple markdown parsing for the text
        if (text) {
            msgDiv.innerHTML += parseMarkdown(text);
        }

        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return msgDiv;
    }

    async function sendToBackend(text, imageBase64) {
        // Show loading state
        const loadingMsg = addMessage('Thinking...', 'ai-message');

        try {
            const formData = new FormData();
            if (text) formData.append('text', text);

            if (imageBase64) {
                // Convert base64 to blob
                const res = await fetch(imageBase64);
                const blob = await res.blob();
                formData.append('image', blob, 'screenshot.png');
            }

            const response = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // Remove loading message
            chatContainer.removeChild(loadingMsg);

            if (data.error) {
                addMessage('Error: ' + data.error, 'ai-message');
            } else {
                addMessage(data.result, 'ai-message');
            }

        } catch (err) {
            chatContainer.removeChild(loadingMsg);
            addMessage('Failed to connect to backend. Is it running? Error: ' + err.message, 'ai-message');
        }
    }

    function parseMarkdown(text) {
        if (!text) return '';

        // Escape HTML
        let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Code blocks ```code```
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Inline code `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Headers #, ##
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>'); // Support h3 for "Approach", "Key Points"

        // Lists
        html = html.replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>');
        // Fix nested uls (simple hack)
        html = html.replace(/<\/ul>\s*<ul>/g, '');

        // Newlines to <br> (except in pre)
        // We need to protect pre tag content from having <br> injected
        // A simple way is to split by pre tags, replace \n in non-pre parts, then rejoin.
        // For simplicity here, just doing global replace if likely not in code block
        // (This is a simplified parser used for basic presentation)
        html = html.replace(/\n/g, '<br>');

        return html;
    }
});
