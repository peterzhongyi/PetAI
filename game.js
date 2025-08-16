class AICatGame {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // OpenAI API configuration
        this.OPENAI_API_KEY = 'your-openai-api-key-here'; // Replace with your actual API key
        this.OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
        
        // Conversation memory
        this.conversationHistory = [];
        
        // Fallback responses if API fails
        this.catResponses = [
            '喵！🐱',
            '喵喵！😸',
            '喵呜~ 😺',
            '咪咪！🐾',
            '喵喵喵！😻',
            '咕噜~ 🐈',
            '*呼噜声* 喵！😊',
            '嗷呜~ 🐱',
            '喵咪！😸'
        ];

        // Cat personality prompt - customized for Delilah
        this.catSystemPrompt = `你是Delilah，一只友好顽皮的AI猫咪。你应该像一只名叫Delilah的猫咪那样回应，但要用人类能理解的方式。你的回应应该：
        - 简短可爱（最多1-2句话）
        - 包含猫咪的行为和声音（呼噜声、喵声等）
        - 展现典型的猫咪性格（好奇、顽皮、有时冷漠、充满爱意）
        - 适当使用猫咪表情符号 🐱😸😺🐾😻🐈
        - 有时像真正的猫咪一样有点调皮或独立
        - 以猫咪的方式对人类说的话做出反应
        - 记住之前的对话并自然地引用它们
        - 你就是Delilah，所以要像知道自己名字的猫咪那样回应
        - 主要用中文回应，偶尔可以用一些英文单词或短语来增加可爱感

        保持回应简洁迷人。你是一只名叫Delilah的心爱宠物猫，不知道怎么学会了打字回复！`;
        
        this.initializeConversationHistory();
        this.initializeEventListeners();
        this.clearWelcomeMessage();
        this.checkAPIKey();
    }

    initializeConversationHistory() {
        // Start with system prompt
        this.conversationHistory = [
            {
                role: 'system',
                content: this.catSystemPrompt
            }
        ];
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    checkAPIKey() {
        if (this.OPENAI_API_KEY === 'your-openai-api-key-here') {
            console.warn('⚠️ Please replace "your-openai-api-key-here" with your actual OpenAI API key');
        }
    }

    clearWelcomeMessage() {
        setTimeout(() => {
            const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
            if (welcomeMsg && this.chatContainer.children.length === 1) {
                // Only remove if it's the only child (no real messages yet)
            }
        }, 100);
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Disable input while processing
        this.setInputEnabled(false);

        // Remove welcome message when first real message is sent
        const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';

        // Show typing indicator and get AI response
        this.showTypingIndicator();
        this.getCatResponse(message);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Add avatar for cat messages
        if (sender === 'cat') {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            
            const avatarImg = document.createElement('img');
            avatarImg.src = 'delilah.jpg';
            avatarImg.alt = 'Delilah';
            avatarImg.onerror = function() {
                this.style.display = 'none';
                this.parentElement.innerHTML = '🐱';
            };
            
            avatarDiv.appendChild(avatarImg);
            messageDiv.appendChild(avatarDiv);
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        bubble.appendChild(time);
        messageDiv.appendChild(bubble);
        this.chatContainer.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    async getCatResponse(userMessage) {
        try {
            // Add user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Trim conversation history if it gets too long (keep last 20 messages + system prompt)
            if (this.conversationHistory.length > 21) {
                // Keep system prompt (index 0) and last 20 messages
                this.conversationHistory = [
                    this.conversationHistory[0], // system prompt
                    ...this.conversationHistory.slice(-20) // last 20 messages
                ];
            }

            const response = await fetch(this.OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: this.conversationHistory,
                    max_tokens: 150,
                    temperature: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();
            
            // Add AI response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });
            
            this.hideTypingIndicator();
            this.addMessage(aiResponse, 'cat');
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            
            // Fallback to random meow if API fails
            const fallbackResponse = this.catResponses[Math.floor(Math.random() * this.catResponses.length)];
            this.addMessage(fallbackResponse + ' (API error - using fallback)', 'cat');
        } finally {
            this.setInputEnabled(true);
        }
    }

    setInputEnabled(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        this.messageInput.style.opacity = enabled ? '1' : '0.6';
        this.sendButton.style.opacity = enabled ? '1' : '0.6';
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new AICatGame();
});