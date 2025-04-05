import { marked } from 'marked';
import { 
    formatDate, 
    getWelcomeMessage,
    speakText,
    updateUserProfile
} from './script_utils.js';
import {
    setupAuthListener,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logoutUser
} from './auth_service.js';
import {
    processWithAI,
    renderUserMessage,
    renderAIMessage,
    showTypingIndicator,
    hideTypingIndicator,
    createNewConversation,
    saveConversations,
    loadConversations
} from './chat_service.js';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle-checkbox');
const chatContainer = document.getElementById('chat-container');
const welcomeSection = document.getElementById('welcome-section');
const startChatBtn = document.getElementById('start-chatting');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const chatMessages = document.getElementById('chat-messages');
const voiceInputBtn = document.getElementById('voice-input-btn');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authModal = document.getElementById('auth-modal');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const closeModalBtn = document.querySelector('.close-modal');
const googleLoginBtn = document.getElementById('google-login');
const googleSignupBtn = document.getElementById('google-signup');
const userProfile = document.getElementById('user-profile');
const loginSignup = document.getElementById('login-signup');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');
const mobileMenuToggle = document.querySelector('.menu-toggle');
const mobileCloseBtn = document.querySelector('.mobile-close');
const sidebar = document.querySelector('.sidebar');
const newChatBtn = document.querySelector('.new-chat');
const historyList = document.getElementById('history-list');
const toneSelect = document.getElementById('tone-select');
const expertiseSelect = document.getElementById('expertise-select');
const generateImageBtn = document.getElementById('generate-image-btn');

// Additional DOM Elements for settings
const updateLogBtn = document.getElementById('update-log-btn');
const visualSettingsBtn = document.getElementById('visual-settings-btn');
const updateLogModal = document.getElementById('update-log-modal');
const visualSettingsModal = document.getElementById('visual-settings-modal');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
const animationSpeedSlider = document.getElementById('animation-speed-slider');
const animationSpeedValue = document.getElementById('animation-speed-value');
const blobIntensitySlider = document.getElementById('blob-intensity-slider');
const blobIntensityValue = document.getElementById('blob-intensity-value');
const resetVisualSettingsBtn = document.getElementById('reset-visual-settings');
const closeModalBtns = document.querySelectorAll('.close-modal');

// State variables
let isAuthenticated = false;
let isVoiceListening = false;
let currentUser = null;
let conversationHistory = [];
let recognition;
let isAITyping = false;
let conversations = [];
let currentConversationId = null;

// Initialize the app
function init() {
    setupEventListeners();
    checkThemePreference();
    setupSpeechRecognition();
    setupAuthListener(handleAuthStateChanged);
    conversations = loadConversations();
    updateConversationList();
    loadVisualSettings(); // Load visual settings
}

// Event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('change', toggleTheme);
    
    // Chat interface
    startChatBtn.addEventListener('click', startNewChat);
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        adjustTextareaHeight();
    });
    messageInput.addEventListener('input', adjustTextareaHeight);
    voiceInputBtn.addEventListener('click', toggleVoiceInput);
    
    // Auth
    loginBtn.addEventListener('click', () => showAuthModal('login'));
    signupBtn.addEventListener('click', () => showAuthModal('signup'));
    closeModalBtn.addEventListener('click', closeAuthModal);
    logoutBtn.addEventListener('click', logout);
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    // Social auth
    googleLoginBtn.addEventListener('click', handleGoogleAuth);
    googleSignupBtn.addEventListener('click', handleGoogleAuth);
    
    // Mobile menu
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    mobileCloseBtn.addEventListener('click', closeMobileMenu);
    
    // New chat
    newChatBtn.addEventListener('click', startNewChat);
    
    // Update log and visual settings
    updateLogBtn?.addEventListener('click', () => showModal(updateLogModal));
    visualSettingsBtn?.addEventListener('click', () => showModal(visualSettingsModal));
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });
    
    // Visual settings controls
    fontSizeSlider?.addEventListener('input', updateFontSize);
    animationSpeedSlider?.addEventListener('input', updateAnimationSpeed);
    blobIntensitySlider?.addEventListener('input', updateBlobIntensity);
    resetVisualSettingsBtn?.addEventListener('click', resetVisualSettings);
    
    // Add image generation button
    generateImageBtn?.addEventListener('click', generateImage);
}

// Theme management
function checkThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
    }
}

function toggleTheme() {
    if (themeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
}

// Chat functionality
function startNewChat() {
    welcomeSection.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    chatMessages.innerHTML = '';
    conversationHistory = [];
    
    // Generate a new conversation
    const newConversation = createNewConversation();
    currentConversationId = newConversation.id;
    conversations.push(newConversation);
    
    updateConversationList();
    saveConversations(conversations);
    
    // Add AI welcome message
    setTimeout(() => {
        renderAIMessage(getWelcomeMessage(), chatMessages, marked);
    }, 500);
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    renderUserMessage(message, chatMessages, currentUser);
    messageInput.value = '';
    adjustTextareaHeight();
    
    // Show typing indicator
    isAITyping = true;
    showTypingIndicator(chatMessages);
    
    // Get AI personality settings
    const tone = toneSelect.value;
    const expertise = expertiseSelect.value;
    
    try {
        // Process with AI
        const result = await processWithAI(
            message, 
            tone, 
            expertise, 
            conversationHistory, 
            currentConversationId, 
            conversations
        );
        
        // Update conversation history and UI
        conversationHistory = result.updatedHistory;
        updateConversationList();
        saveConversations(conversations);
        
        // Hide typing indicator and show AI response
        isAITyping = false;
        hideTypingIndicator();
        renderAIMessage(result.aiResponse, chatMessages, marked);
        
        // Speak the response if voice is enabled
        if (isVoiceListening) {
            speakText(result.aiResponse);
        }
    } catch (error) {
        console.error("Error in chat:", error);
        isAITyping = false;
        hideTypingIndicator();
        renderAIMessage("I'm sorry, I encountered an error. Please try again.", chatMessages, marked);
    }
}

function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';
}

// Voice functionality
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            messageInput.value = transcript;
        };
        
        recognition.onend = () => {
            if (isVoiceListening) {
                sendMessage();
                isVoiceListening = false;
                voiceInputBtn.classList.remove('active');
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isVoiceListening = false;
            voiceInputBtn.classList.remove('active');
        };
    } else {
        voiceInputBtn.style.display = 'none';
        console.log('Speech recognition not supported');
    }
}

function toggleVoiceInput() {
    if (!recognition) return;
    
    if (isVoiceListening) {
        recognition.stop();
        isVoiceListening = false;
        voiceInputBtn.classList.remove('active');
    } else {
        recognition.start();
        isVoiceListening = true;
        voiceInputBtn.classList.add('active');
        messageInput.value = '';
        messageInput.placeholder = 'Listening...';
    }
}

// Authentication
function showAuthModal(tab) {
    authModal.classList.remove('hidden');
    authModal.classList.add('active');
    switchTab(tab);
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    authModal.classList.remove('active');
    setTimeout(() => {
        authModal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

function switchTab(tab) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show selected tab content
    if (tab === 'login') {
        document.getElementById('login-tab').classList.remove('hidden');
        document.getElementById('signup-tab').classList.add('hidden');
    } else {
        document.getElementById('login-tab').classList.add('hidden');
        document.getElementById('signup-tab').classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await signInWithEmail(email, password);
        closeAuthModal();
    } catch (error) {
        console.error("Login error:", error);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        await signUpWithEmail(email, password, name);
        closeAuthModal();
    } catch (error) {
        console.error("Signup error:", error);
    }
}

async function handleGoogleAuth() {
    try {
        await signInWithGoogle();
        closeAuthModal();
    } catch (error) {
        console.error("Google auth error:", error);
    }
}

async function logout() {
    try {
        await logoutUser();
    } catch (error) {
        console.error("Logout error:", error);
    }
}

function handleAuthStateChanged(user) {
    if (user) {
        // User is signed in with enriched profile
        currentUser = user;
        isAuthenticated = true;
    } else {
        // User is signed out
        currentUser = null;
        isAuthenticated = false;
    }
    updateAuthUI();
}

function updateAuthUI() {
    if (isAuthenticated) {
        userProfile.classList.remove('hidden');
        loginSignup.classList.add('hidden');
        
        // Update username with more robust display logic
        if (currentUser.googleProviderData) {
            // Prefer Google display name
            userName.textContent = currentUser.googleProviderData.displayName || currentUser.name;
            
            // Update avatar if Google profile image is available
            if (currentUser.googleProviderData.photoURL) {
                const userAvatar = userProfile.querySelector('.user-avatar');
                userAvatar.innerHTML = `<img src="${currentUser.googleProviderData.photoURL}" alt="User Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
        } else {
            // Fallback to default name display
            userName.textContent = currentUser.name;
        }
    } else {
        userProfile.classList.add('hidden');
        loginSignup.classList.remove('hidden');
    }
}

async function updateProfileDetails() {
    try {
        // Example of updating profile (could be triggered by a new button/modal)
        await updateUserProfile({
            displayName: 'New Display Name',
            photoURL: 'https://example.com/new-avatar.jpg'
        });
        
        // Refresh UI
        updateAuthUI();
    } catch (error) {
        console.error('Profile update failed:', error);
    }
}

// Mobile menu
function toggleMobileMenu() {
    sidebar.classList.add('open');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
}

// Conversations
function updateConversationList() {
    historyList.innerHTML = '';
    
    // Sort conversations by date (newest first)
    const sortedConversations = [...conversations].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    sortedConversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        if (conversation.id === currentConversationId) {
            conversationItem.classList.add('active');
        }
        
        conversationItem.innerHTML = `
            <div class="conversation-title">${conversation.title}</div>
            <div class="conversation-date">${formatDate(new Date(conversation.timestamp))}</div>
        `;
        
        conversationItem.addEventListener('click', () => {
            loadConversation(conversation.id);
        });
        
        historyList.appendChild(conversationItem);
    });
}

function loadConversation(id) {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;
    
    // Update current conversation
    currentConversationId = id;
    
    // Clear chat and load messages
    welcomeSection.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    chatMessages.innerHTML = '';
    
    // Rebuild conversation history
    conversationHistory = [];
    conversation.messages.forEach(msg => {
        if (msg.role === 'user') {
            renderUserMessage(msg.content, chatMessages, currentUser);
        } else {
            renderAIMessage(msg.content, chatMessages, marked);
        }
        conversationHistory.push(msg);
    });
    
    // Update UI
    updateConversationList();
    closeMobileMenu();
}

async function generateImage() {
    const imagePrompt = messageInput.value.trim();
    if (!imagePrompt) return;
    
    renderUserMessage("Generate image: " + imagePrompt, chatMessages, currentUser);
    messageInput.value = '';
    adjustTextareaHeight();
    
    // Show typing indicator
    isAITyping = true;
    showTypingIndicator(chatMessages);
    
    try {
        // Call image generation API
        const result = await websim.imageGen({
            prompt: imagePrompt,
            aspect_ratio: "16:9",
        });
        
        // Create message with image
        const imageMessage = `![Generated Image](${result.url})`;
        
        // Hide typing indicator and show AI response with image
        isAITyping = false;
        hideTypingIndicator();
        renderAIMessage(imageMessage, chatMessages, marked);
        
        // Add to conversation history
        conversationHistory.push(
            { role: "user", content: "Generate image: " + imagePrompt },
            { role: "assistant", content: imageMessage }
        );
        
        // Update conversation in storage
        const currentConversation = conversations.find(c => c.id === currentConversationId);
        if (currentConversation) {
            currentConversation.messages.push(
                { role: "user", content: "Generate image: " + imagePrompt },
                { role: "assistant", content: imageMessage }
            );
        }
        
        updateConversationList();
        saveConversations(conversations);
        
    } catch (error) {
        console.error("Error generating image:", error);
        isAITyping = false;
        hideTypingIndicator();
        renderAIMessage("I'm sorry, I encountered an error generating the image. Please try again.", chatMessages, marked);
    }
}

// Generic modal functions
function showModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

// Visual settings functions
function updateFontSize() {
    const value = fontSizeSlider.value;
    fontSizeValue.textContent = value;
    document.documentElement.style.setProperty('--font-size-factor', `${value}%`);
    localStorage.setItem('font-size', value);
}

function updateAnimationSpeed() {
    const value = animationSpeedSlider.value;
    animationSpeedValue.textContent = value;
    
    // Calculate the animation duration factor (inversely proportional to speed)
    const durationFactor = 100 / value;
    document.documentElement.style.setProperty('--animation-speed-factor', durationFactor);
    localStorage.setItem('animation-speed', value);
}

function updateBlobIntensity() {
    const value = blobIntensitySlider.value;
    blobIntensityValue.textContent = value;
    
    const opacityValue = value / 100;
    document.documentElement.style.setProperty('--blob-opacity', opacityValue);
    localStorage.setItem('blob-intensity', value);
}

function resetVisualSettings() {
    // Reset sliders to default values
    fontSizeSlider.value = 100;
    animationSpeedSlider.value = 100;
    blobIntensitySlider.value = 60;
    
    // Update UI and apply changes
    fontSizeValue.textContent = "100";
    animationSpeedValue.textContent = "100";
    blobIntensityValue.textContent = "60";
    
    document.documentElement.style.setProperty('--font-size-factor', '100%');
    document.documentElement.style.setProperty('--animation-speed-factor', '1');
    document.documentElement.style.setProperty('--blob-opacity', '0.6');
    
    // Clear saved settings
    localStorage.removeItem('font-size');
    localStorage.removeItem('animation-speed');
    localStorage.removeItem('blob-intensity');
}

// Load saved visual settings
function loadVisualSettings() {
    // Font size
    const savedFontSize = localStorage.getItem('font-size') || 100;
    fontSizeSlider.value = savedFontSize;
    fontSizeValue.textContent = savedFontSize;
    document.documentElement.style.setProperty('--font-size-factor', `${savedFontSize}%`);
    
    // Animation speed
    const savedAnimationSpeed = localStorage.getItem('animation-speed') || 100;
    animationSpeedSlider.value = savedAnimationSpeed;
    animationSpeedValue.textContent = savedAnimationSpeed;
    const durationFactor = 100 / savedAnimationSpeed;
    document.documentElement.style.setProperty('--animation-speed-factor', durationFactor);
    
    // Blob intensity
    const savedBlobIntensity = localStorage.getItem('blob-intensity') || 60;
    blobIntensitySlider.value = savedBlobIntensity;
    blobIntensityValue.textContent = savedBlobIntensity;
    const opacityValue = savedBlobIntensity / 100;
    document.documentElement.style.setProperty('--blob-opacity', opacityValue);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);