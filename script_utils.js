// Breaking out utility functions from script.js to manage file size
// These are utility functions extracted from the main script.js file

import { enhanceCodeBlocks } from './code_utils.js';

// Format utilities
export function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}

export function formatMessage(message, marked) {
    const formattedHtml = marked.parse(message);
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = formattedHtml;
    
    // Use the new code block enhancement function if marked is available
    if (marked) {
        enhanceCodeBlocks(tempContainer, marked);
    }
    
    return tempContainer.innerHTML;
}

// Chat utilities
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateTitleFromMessage(message) {
    // Generate a title from the first message
    const words = message.split(' ');
    if (words.length <= 3) {
        return message;
    } else {
        return words.slice(0, 3).join(' ') + '...';
    }
}

// UI utilities
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Automatically remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Text to speech utility
export function speakText(text) {
    if ('speechSynthesis' in window) {
        // Strip markdown and HTML for cleaner speech
        const plainText = text.replace(/\*\*(.*?)\*\*/g, '$1')
                             .replace(/\*(.*?)\*/g, '$1')
                             .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
                             .replace(/#{1,6}\s(.*)/g, '$1')
                             .replace(/<[^>]*>/g, '');
        
        const utterance = new SpeechSynthesisUtterance(plainText);
        window.speechSynthesis.speak(utterance);
    }
}

// User utility
export function updateUserProfile(user, updates) {
    // Basic implementation of profile update
    if (user) {
        // Update display name if provided
        if (updates.displayName) {
            user.displayName = updates.displayName;
        }
        
        // Update photo URL if provided
        if (updates.photoURL) {
            user.photoURL = updates.photoURL;
        }
        
        return user;
    }
    return null;
}

// Chat AI response simulator
export function simulateAIResponse(message, tone, expertise) {
    return new Promise((resolve) => {
        // Simulate network delay
        const responseTime = 1000 + Math.random() * 2000;
        
        setTimeout(() => {
            let response;
            
            // Simple response generation based on tone and expertise
            if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
                if (tone === "friendly") {
                    response = "Hello there! It's great to chat with you today. How can I help you?";
                } else if (tone === "professional") {
                    response = "Greetings. I'm pleased to assist you today. How may I be of service?";
                } else if (tone === "witty") {
                    response = "Well hello! Fancy meeting you in this digital realm. What's the word?";
                } else if (tone === "poetic") {
                    response = "Salutations, dear friend, in this digital space,\nWith bytes and with pixels, we meet face to face.";
                }
            } else if (message.toLowerCase().includes("help") || message.toLowerCase().includes("can you")) {
                if (expertise === "technical") {
                    response = "I'd be happy to help with that. Let me break this down technically:\n\n1. First, we need to understand the problem scope\n2. Then, we can explore potential solutions\n3. Finally, we can implement the best approach based on your specific requirements\n\nCould you provide more details about what you need help with?";
                } else if (expertise === "creative") {
                    response = "I'd love to help! Let's think creatively about this. What if we approach this from a completely different angle? Sometimes the most innovative solutions come from unexpected perspectives. Tell me more about what you're looking for!";
                } else if (expertise === "business") {
                    response = "I can certainly assist with that. From a business perspective, we should consider:\n\n- Strategic implications\n- Resource allocation\n- ROI potential\n- Market positioning\n\nWhat specific business challenge are you facing?";
                } else {
                    response = "I'm here to help! What specifically would you like assistance with?";
                }
            } else {
                // Default responses based on tone
                const responses = {
                    friendly: "That's an interesting point! I'd love to explore that further with you. Could you tell me more?",
                    professional: "I understand. Based on the information provided, I recommend we proceed with a thorough analysis. Would you like me to elaborate?",
                    witty: "Well, that's a brain-teaser! My circuits are buzzing with ideas. Let me spin up some creative thoughts for you.",
                    poetic: "Words flow like rivers, thoughts like stars in the night,\nIn conversation's dance, we seek wisdom's light."
                };
                response = responses[tone] || "I see. That's interesting. Can you tell me more?";
            }
            
            resolve(response);
        }, responseTime);
    });
}

// Default welcome messages
export function getWelcomeMessage() {
    const messages = [
        "Hello! How can I assist you today?",
        "Hi there! I'm Nexus AI. What can I help you with?",
        "Welcome! I'm ready to chat. What's on your mind?",
        "Greetings! What would you like to talk about?"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}