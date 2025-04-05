// Service for handling all chat-related functionality
import { 
    formatTime, 
    formatMessage, 
    generateUniqueId, 
    generateTitleFromMessage, 
} from './script_utils.js';

// Process AI message with selected personality settings
export async function processWithAI(message, tone, expertise, conversationHistory, currentConversationId, conversations) {
    try {
        // Save message to conversation history
        conversationHistory.push({
            role: "user",
            content: message
        });
        
        // Prepare system prompt based on personality settings
        let systemPrompt = "You are a helpful AI assistant";
        
        if (tone === "friendly") {
            systemPrompt += " with a warm and approachable tone";
        } else if (tone === "professional") {
            systemPrompt += " with a formal and professional tone";
        } else if (tone === "witty") {
            systemPrompt += " with a humorous and clever tone";
        } else if (tone === "poetic") {
            systemPrompt += " who speaks in rhythmic, poetic language";
        }
        
        if (expertise === "technical") {
            systemPrompt += ". You have extensive knowledge in technical fields and provide detailed explanations.";
        } else if (expertise === "creative") {
            systemPrompt += ". You excel at creative thinking and imaginative ideas.";
        } else if (expertise === "business") {
            systemPrompt += ". You're knowledgeable about business topics and provide strategic advice.";
        } else {
            systemPrompt += ". You have broad knowledge across many topics.";
        }
        
        // Call real LLM API instead of simulation
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...conversationHistory.slice(-10) // Send only recent messages to stay within context limits
            ]
        });
        
        const aiResponse = completion.content;
        
        // Add AI response to conversation history
        conversationHistory.push({
            role: "assistant",
            content: aiResponse
        });
        
        // Update conversation in storage
        const currentConversation = conversations.find(c => c.id === currentConversationId);
        if (currentConversation) {
            currentConversation.messages.push(
                { role: "user", content: message },
                { role: "assistant", content: aiResponse }
            );
            
            // Update title if this is the first message
            if (currentConversation.messages.length === 2) {
                currentConversation.title = generateTitleFromMessage(message);
            }
        }
        
        return {
            aiResponse: aiResponse,
            updatedHistory: conversationHistory
        };
    } catch (error) {
        console.error("Error processing with AI:", error);
        throw error;
    }
}

// Render user message in the UI
export function renderUserMessage(message, chatMessages, currentUser) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    
    messageElement.innerHTML = `
        <div class="message-avatar user-avatar-img">
            ${currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div class="message-content">
            <div class="message-text">${message}</div>
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom(chatMessages);
}

// Render AI message in the UI
export function renderAIMessage(message, chatMessages, marked) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message';
    
    messageElement.innerHTML = `
        <div class="message-avatar ai-avatar-img">
            <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-text">${formatMessage(message, marked)}</div>
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom(chatMessages);
}

// Show typing indicator
export function showTypingIndicator(chatMessages) {
    const typingElement = document.createElement('div');
    typingElement.className = 'message ai-message';
    typingElement.id = 'typing-indicator';
    
    typingElement.innerHTML = `
        <div class="message-avatar ai-avatar-img">
            <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingElement);
    scrollToBottom(chatMessages);
}

// Remove typing indicator
export function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Helper to scroll chat to bottom
function scrollToBottom(chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Create a new conversation
export function createNewConversation() {
    const conversationId = generateUniqueId();
    return {
        id: conversationId,
        title: 'New Conversation',
        timestamp: new Date().toISOString(),
        messages: []
    };
}

// Save conversations to localStorage
export function saveConversations(conversations) {
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

// Load conversations from localStorage
export function loadConversations() {
    const savedConversations = localStorage.getItem('conversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
}