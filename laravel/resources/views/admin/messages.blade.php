@extends('admin.layout')

@section('content')
<div class="chat-wrapper">
    <!-- Left Pane: Conversations List -->
    <div class="chat-sidebar">
        <!-- Role Tab Selector -->
        <div class="role-selector-container">
            <div class="role-selector-pill">
                <button type="button" class="role-tab active" data-role="customer">Customer</button>
                <button type="button" class="role-tab" data-role="driver">Driver</button>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="chat-search-container">
            <div class="search-input-wrapper">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>
                </svg>
                <input type="text" id="chatSearchInput" placeholder="Cari percakapan...">
            </div>
        </div>

        <!-- Conversations Feed -->
        <div class="conversations-list" id="conversationsList">
            <!-- Loading state -->
            <div class="chat-list-loading">
                <div class="spinner"></div>
            </div>
        </div>
    </div>

    <!-- Right Pane: Active Chat Window -->
    <div class="chat-body" id="chatWindow">
        <!-- Default State: No conversation selected -->
        <div class="empty-chat-state" id="emptyChatState">
            <svg class="empty-chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 13h5"/>
            </svg>
            <h2>Pilih Percakapan</h2>
            <p>Pilih salah satu customer atau driver untuk mulai membalas pesan.</p>
        </div>

        <!-- Chat Content (Hidden initially) -->
        <div class="chat-active-container" id="chatActiveContainer" style="display: none;">
            <!-- Header -->
            <header class="chat-header">
                <div class="header-profile">
                    <div class="chat-user-avatar" id="activeUserAvatar">SF</div>
                    <div class="chat-user-meta">
                        <h3 id="activeUserName">Nama User</h3>
                        <span class="user-status-dot online">Online</span>
                    </div>
                </div>
                <div class="header-options">
                    <button type="button" class="options-btn">
                        <svg class="options-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                        </svg>
                    </button>
                </div>
            </header>

            <!-- Message Feed -->
            <div class="chat-messages-feed" id="chatMessagesFeed">
                <!-- Grouped messages go here -->
            </div>

            <!-- Image Preview Bar (Shown when user selects an image file) -->
            <div class="chat-image-preview-bar" id="chatImagePreviewBar" style="display: none;">
                <div class="preview-item">
                    <img id="chatImagePreview" src="" alt="Preview">
                    <button type="button" class="remove-preview-btn" onclick="clearSelectedImage()">
                        <svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Input Bar -->
            <footer class="chat-footer-bar">
                <form id="chatSendForm" onsubmit="submitAdminMessage(event)">
                    <button type="button" class="attach-btn" onclick="triggerFileInput()">
                        <svg class="plus-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </button>
                    
                    <input type="file" id="chatFileInput" accept="image/*" style="display: none;" onchange="handleFileSelected(event)">
                    
                    <div class="input-text-container">
                        <input type="text" id="chatMessageInput" placeholder="Tulis Pesan Disini..." autocomplete="off">
                    </div>

                    <button type="submit" class="send-message-btn" id="chatSendBtn" disabled>
                        <span>Kirim</span>
                        <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                        </svg>
                    </button>
                </form>
            </footer>
        </div>
    </div>
</div>

<style>
/* CSS Variables & Tokens specific to chat interface */
:root {
    --chat-border: #e2e8f0;
    --chat-bubble-in: #ffffff;
    --chat-bubble-out: #ffffff;
    --chat-blue-primary: #1c3c88;
    --chat-blue-light: #eff6ff;
    --chat-text-dark: #1e293b;
    --chat-text-muted: #64748b;
    --chat-bg-main: #f8fafc;
}

.chat-wrapper {
    display: flex;
    background: #ffffff;
    border: 1px solid var(--chat-border);
    border-radius: 12px;
    height: calc(100vh - 120px);
    overflow: hidden;
    margin-top: 10px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

/* Sidebar Styling */
.chat-sidebar {
    width: 380px;
    border-right: 1px solid var(--chat-border);
    display: flex;
    flex-direction: column;
    background: #ffffff;
    flex-shrink: 0;
}

.role-selector-container {
    padding: 16px;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
}

.role-selector-pill {
    display: flex;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 8px;
}

.role-tab {
    flex: 1;
    border: 0;
    background: transparent;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 700;
    color: var(--chat-text-muted);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.role-tab.active {
    background: #ffffff;
    color: var(--chat-blue-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chat-search-container {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input-wrapper input {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 8px 16px 8px 40px;
    font-size: 13.5px;
    color: var(--chat-text-dark);
    outline: none;
    transition: all 0.2s ease;
}

.search-input-wrapper input:focus {
    border-color: var(--chat-blue-primary);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(28, 60, 136, 0.1);
}

.search-icon {
    position: absolute;
    left: 14px;
    width: 18px;
    height: 18px;
    color: var(--chat-text-muted);
    stroke-width: 2.2;
}

.conversations-list {
    flex: 1;
    overflow-y: auto;
}

.chat-list-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid var(--chat-blue-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.empty-conversations-state {
    padding: 32px 16px;
    text-align: center;
    color: var(--chat-text-muted);
}

.empty-conversations-state svg {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    opacity: 0.4;
    stroke-width: 1.5;
}

.empty-conversations-state p {
    font-size: 13.5px;
}

.conversation-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: background 0.15s ease;
    position: relative;
}

.conversation-item:hover {
    background: #f8fafc;
}

.conversation-item.active {
    background: var(--chat-blue-light);
    border-left: 4px solid var(--chat-blue-primary);
    padding-left: 12px;
}

.avatar-initials-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--chat-blue-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    margin-right: 14px;
    flex-shrink: 0;
}

/* HARMONIOUS AVATAR COLORS LIKE PHOTO */
.bg-sf { background: #3b82f6; } /* Siti Fatimah */
.bg-bs { background: #10b981; } /* Budi Santoso */
.bg-ap { background: #f59e0b; } /* Andi Pratama */
.bg-rk { background: #a16207; } /* Rina Kartika */

.convo-details {
    flex: 1;
    min-width: 0;
}

.convo-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.convo-title-row h3 {
    margin: 0;
    font-size: 14.5px;
    font-weight: 700;
    color: var(--chat-text-dark);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.convo-time {
    font-size: 11px;
    color: var(--chat-text-muted);
}

.convo-msg-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.convo-last-msg {
    margin: 0;
    font-size: 12.5px;
    color: var(--chat-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 8px;
}

.convo-item.active .convo-last-msg {
    color: var(--chat-text-dark);
}

.unread-count-badge {
    background: var(--chat-blue-primary);
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}

/* Chat Main Body */
.chat-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--chat-bg-main);
    position: relative;
}

.empty-chat-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 32px;
    color: var(--chat-text-muted);
    text-align: center;
}

.empty-chat-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.3;
    stroke-width: 1.5;
}

.empty-chat-state h2 {
    font-size: 18px;
    font-weight: 800;
    color: var(--chat-text-dark);
    margin: 0 0 6px 0;
}

.empty-chat-state p {
    font-size: 13.5px;
    max-width: 320px;
}

.chat-active-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* Chat Header */
.chat-header {
    background: #ffffff;
    border-bottom: 1px solid var(--chat-border);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    flex-shrink: 0;
}

.header-profile {
    display: flex;
    align-items: center;
}

.chat-user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--chat-blue-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14.5px;
    margin-right: 12px;
}

.chat-user-meta h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--chat-text-dark);
}

.user-status-dot {
    font-size: 11px;
    color: var(--chat-text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
}

.user-status-dot.online::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
}

.options-btn {
    background: transparent;
    border: 0;
    color: var(--chat-text-muted);
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.options-btn:hover {
    background: #f1f5f9;
}

.options-icon {
    width: 20px;
    height: 20px;
    stroke-width: 2.2;
}

/* Chat Message Feed Area */
.chat-messages-feed {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Date separators */
.date-separator {
    display: flex;
    justify-content: center;
    margin: 8px 0;
}

.date-pill {
    background: #ffffff;
    border: 1px solid var(--chat-border);
    padding: 4px 14px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--chat-text-muted);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

/* Bubbles Styles matching the exact layout of the 2nd photo */
.message-bubble-row {
    display: flex;
    width: 100%;
    margin-bottom: 4px;
}

.message-bubble-row.customer-msg {
    justify-content: flex-start;
}

.message-bubble-row.admin-msg {
    justify-content: flex-end;
}

.bubble-outer {
    max-width: 65%;
    display: flex;
    flex-direction: column;
}

.bubble-main {
    background: #ffffff;
    border: 1px solid var(--chat-border);
    border-radius: 8px;
    padding: 10px 14px;
    position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.customer-msg .bubble-main {
    border-radius: 0 8px 8px 8px;
}

.admin-msg .bubble-main {
    border-radius: 8px 0 8px 8px;
    border-color: var(--chat-blue-primary);
}

.bubble-text-content {
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--chat-text-dark);
    margin: 0;
    word-break: break-word;
}

.bubble-img-attachment {
    border-radius: 6px;
    max-width: 100%;
    max-height: 200px;
    object-fit: cover;
    margin-bottom: 6px;
    cursor: pointer;
}

.bubble-meta-info {
    display: flex;
    align-items: center;
    margin-top: 6px;
    gap: 6px;
}

.customer-msg .bubble-meta-info {
    justify-content: flex-start;
}

.admin-msg .bubble-meta-info {
    justify-content: flex-end;
}

.bubble-user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--chat-blue-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 9px;
}

.bubble-time-stamp {
    font-size: 10.5px;
    color: var(--chat-text-muted);
}

.double-checkmark {
    width: 14px;
    height: 14px;
    color: #10b981;
}

/* Image preview section above footer */
.chat-image-preview-bar {
    background: #ffffff;
    border-top: 1px solid var(--chat-border);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.preview-item {
    position: relative;
    width: 80px;
    height: 80px;
    border: 1px solid var(--chat-border);
    border-radius: 8px;
    overflow: hidden;
}

.preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-preview-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #ffffff;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.close-icon {
    width: 12px;
    height: 12px;
    stroke-width: 3;
}

/* Footer / Input Bar Styling */
.chat-footer-bar {
    background: #ffffff;
    border-top: 1px solid var(--chat-border);
    padding: 14px 20px;
    height: 72px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.chat-footer-bar form {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;
}

.attach-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f1f5f9;
    border: 0;
    color: var(--chat-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
    flex-shrink: 0;
}

.attach-btn:hover {
    background: #e2e8f0;
}

.plus-icon {
    width: 22px;
    height: 22px;
    stroke-width: 2.5;
}

.input-text-container {
    flex: 1;
    background: #f1f5f9;
    border-radius: 24px;
    padding: 4px 18px;
    display: flex;
    align-items: center;
    height: 44px;
}

.input-text-container input {
    width: 100%;
    border: 0;
    background: transparent;
    outline: none;
    font-size: 13.5px;
    color: var(--chat-text-dark);
}

.input-text-container input::placeholder {
    color: #94a3b8;
}

.send-message-btn {
    height: 44px;
    background: var(--chat-blue-primary);
    color: #ffffff;
    border: 0;
    border-radius: 22px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
}

.send-message-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.send-message-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #cbd5e1;
    color: #94a3b8;
}

.send-icon {
    width: 16px;
    height: 16px;
    transform: rotate(0deg);
}
</style>

<script>
// Main state variables
let activeRole = 'customer';
let activeUserId = null;
let activeUserName = '';
let activeUserInitials = '';
let selectedImageFile = null;
let pollTimer = null;
let chatsData = [];

// API endpoints
const API_CONVERSATIONS = "{{ route('admin.messages.conversations') }}";
const API_MESSAGES_PREFIX = "{{ url('admin/messages/user') }}";
const API_SEND = "{{ route('admin.messages.send') }}";

document.addEventListener('DOMContentLoaded', function () {
    // 1. Role selectors click handlers
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            activeRole = this.getAttribute('data-role');
            loadConversations();
            
            // Clear search filter when toggling tabs
            document.getElementById('chatSearchInput').value = '';
        });
    });

    // 2. Search input filtering
    document.getElementById('chatSearchInput').addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        document.querySelectorAll('.conversation-item').forEach(item => {
            const name = item.querySelector('.name').innerText.toLowerCase();
            const msg = item.querySelector('.convo-last-msg').innerText.toLowerCase();
            if (name.includes(query) || msg.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // 3. Message input change handlers to toggle Send button disabled state
    const msgInput = document.getElementById('chatMessageInput');
    msgInput.addEventListener('input', function () {
        toggleSendBtnState();
    });

    // Initial conversations load
    loadConversations();

    // Start background polling for conversations list
    setInterval(loadConversationsSilent, 4000);
});

// Load conversations list with spinner loading indicator
function loadConversations() {
    const listContainer = document.getElementById('conversationsList');
    listContainer.innerHTML = `<div class="chat-list-loading"><div class="spinner"></div></div>`;

    fetch(`${API_CONVERSATIONS}?role=${activeRole}`)
        .then(res => res.json())
        .then(response => {
            renderConversations(response.data);
        })
        .catch(err => {
            console.error('Failed to load conversations', err);
            listContainer.innerHTML = `<div class="empty-conversations-state"><p>Gagal memuat percakapan.</p></div>`;
        });
}

// Background silent refresh for conversations
function loadConversationsSilent() {
    fetch(`${API_CONVERSATIONS}?role=${activeRole}`)
        .then(res => res.json())
        .then(response => {
            renderConversationsSilent(response.data);
        })
        .catch(err => console.error('Silent load failed', err));
}

// Render conversations list in sidebar
function renderConversations(conversations) {
    const listContainer = document.getElementById('conversationsList');
    if (!conversations || conversations.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-conversations-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <p>Belum ada pesan dari ${activeRole === 'customer' ? 'Customer' : 'Driver'}.</p>
            </div>
        `;
        return;
    }

    let html = '';
    conversations.forEach(convo => {
        const user = convo.user;
        const isActive = activeUserId === user.id ? 'active' : '';
        const unreadBadge = convo.unread_count > 0 ? `<span class="unread-count-badge">${convo.unread_count}</span>` : '';
        
        // Define color classes for initials avatar circle to match design
        let colorClass = 'bg-sf';
        const initials = user.initials.toUpperCase();
        if (initials === 'SF') colorClass = 'bg-sf';
        else if (initials === 'BS') colorClass = 'bg-bs';
        else if (initials === 'AP') colorClass = 'bg-ap';
        else if (initials === 'RK') colorClass = 'bg-rk';
        else {
            // Assign color based on char code sum
            const charSum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
            const index = charSum % 4;
            colorClass = ['bg-sf', 'bg-bs', 'bg-ap', 'bg-rk'][index];
        }

        html += `
            <div class="conversation-item ${isActive}" data-user-id="${user.id}" onclick="selectConversation('${user.id}', '${user.name}', '${user.initials}')">
                <div class="avatar-container">
                    <div class="avatar-initials-circle ${colorClass}">${user.initials}</div>
                </div>
                <div class="convo-details">
                    <div class="convo-title-row">
                        <h3 class="name">${user.name}</h3>
                        <span class="convo-time">${convo.last_message_time}</span>
                    </div>
                    <div class="convo-msg-row">
                        <p class="convo-last-msg">${convo.last_message}</p>
                        ${unreadBadge}
                    </div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// Silently merge conversations to prevent flickering selection
function renderConversationsSilent(conversations) {
    const listContainer = document.getElementById('conversationsList');
    if (!conversations || conversations.length === 0) return;

    // Save scroll position
    const scrollPos = listContainer.scrollTop;

    // Check if the HTML elements list needs update
    // We can just repaint for now, but keeping active element selection
    renderConversations(conversations);

    // Restore scroll position
    listContainer.scrollTop = scrollPos;
}

// Select chat target conversation
function selectConversation(userId, userName, initials) {
    activeUserId = userId;
    activeUserName = userName;
    activeUserInitials = initials;

    // 1. Highlight clicked item
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-user-id') === userId) {
            item.classList.add('active');
            // Remove unread badge locally
            const badge = item.querySelector('.unread-count-badge');
            if (badge) badge.remove();
        }
    });

    // 2. Display chat main layout
    document.getElementById('emptyChatState').style.display = 'none';
    document.getElementById('chatActiveContainer').style.display = 'flex';

    // 3. Set header details
    document.getElementById('activeUserName').innerText = userName;
    
    const avatar = document.getElementById('activeUserAvatar');
    avatar.innerText = initials;
    
    // Set matching avatar color in header
    avatar.className = 'chat-user-avatar'; // Reset
    let colorClass = 'bg-sf';
    const init = initials.toUpperCase();
    if (init === 'SF') colorClass = 'bg-sf';
    else if (init === 'BS') colorClass = 'bg-bs';
    else if (init === 'AP') colorClass = 'bg-ap';
    else if (init === 'RK') colorClass = 'bg-rk';
    avatar.classList.add(colorClass);

    // 4. Fetch message history
    loadMessages(userId);

    // Reset polling timers
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
        loadMessagesSilent(activeUserId);
    }, 3000);
}

// Fetch messages
function loadMessages(userId) {
    const feed = document.getElementById('chatMessagesFeed');
    feed.innerHTML = `
        <div class="chat-list-loading">
            <div class="spinner"></div>
        </div>
    `;

    fetch(`${API_MESSAGES_PREFIX}/${userId}`)
        .then(res => res.json())
        .then(response => {
            chatsData = response.data;
            renderMessagesFeed(response.data);
            scrollFeedToBottom();
        })
        .catch(err => {
            console.error('Failed to load chat messages', err);
            feed.innerHTML = `<div class="empty-conversations-state"><p>Gagal memuat pesan.</p></div>`;
        });
}

// Background poll message updates
function loadMessagesSilent(userId) {
    if (activeUserId !== userId) return;

    fetch(`${API_MESSAGES_PREFIX}/${userId}`)
        .then(res => res.json())
        .then(response => {
            // Check if messages count or contents changed before repainting
            const newChats = response.data;
            if (newChats.length !== chatsData.length || JSON.stringify(newChats) !== JSON.stringify(chatsData)) {
                chatsData = newChats;
                renderMessagesFeed(newChats);
                scrollFeedToBottom();
            }
        })
        .catch(err => console.error('Silent load messages failed', err));
}

// Render message bubbles grouped by date separators
function renderMessagesFeed(messages) {
    const feed = document.getElementById('chatMessagesFeed');
    if (!messages || messages.length === 0) {
        feed.innerHTML = `
            <div class="empty-chat-state">
                <p>Belum ada pesan. Ketik pesan untuk memulai obrolan!</p>
            </div>
        `;
        return;
    }

    let html = '';
    let lastDateLabel = '';

    messages.forEach(msg => {
        // Date grouping logic
        const dateObj = new Date(msg.created_at);
        const dateLabel = formatDateLabel(dateObj);
        
        if (dateLabel !== lastDateLabel) {
            html += `
                <div class="date-separator">
                    <span class="date-pill">${dateLabel}</span>
                </div>
            `;
            lastDateLabel = dateLabel;
        }

        // Determine sender role
        const isAdmin = msg.sender_id !== activeUserId; // If sender is not the customer/driver, it's the admin
        const rowClass = isAdmin ? 'admin-msg' : 'customer-msg';
        const msgTime = formatMessageTime(dateObj);

        // Define attachment image layout
        const imageMarkup = msg.image_url 
            ? `<img src="${msg.image_url}" class="bubble-img-attachment" onclick="viewLargeImage('${msg.image_url}')">`
            : '';

        // Text markup
        const textMarkup = msg.message 
            ? `<p class="bubble-text-content">${escapeHTML(msg.message)}</p>`
            : '';

        if (isAdmin) {
            // Admin message layout (bubble right)
            html += `
                <div class="message-bubble-row ${rowClass}">
                    <div class="bubble-outer">
                        <div class="bubble-main">
                            ${imageMarkup}
                            ${textMarkup}
                        </div>
                        <div class="bubble-meta-info">
                            <span class="bubble-time-stamp">${msgTime}</span>
                            <svg class="double-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m3 13 4 4L19 7M7 13l4 4L21 7"/>
                            </svg>
                            <div class="bubble-user-avatar bg-sf">AD</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Customer message layout (bubble left)
            html += `
                <div class="message-bubble-row ${rowClass}">
                    <div class="bubble-outer">
                        <div class="bubble-main">
                            ${imageMarkup}
                            ${textMarkup}
                        </div>
                        <div class="bubble-meta-info">
                            <div class="bubble-user-avatar bg-sf">${activeUserInitials}</div>
                            <span class="bubble-time-stamp">${msgTime}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    feed.innerHTML = html;
}

// Scroll chat feed container to bottom
function scrollFeedToBottom() {
    const feed = document.getElementById('chatMessagesFeed');
    setTimeout(() => {
        feed.scrollTop = feed.scrollHeight;
    }, 100);
}

// Toggle Send button disabled state
function toggleSendBtnState() {
    const text = document.getElementById('chatMessageInput').value.trim();
    const hasContent = text.length > 0 || selectedImageFile !== null;
    document.getElementById('chatSendBtn').disabled = !hasContent;
}

// File Attachment pick trigger
function triggerFileInput() {
    document.getElementById('chatFileInput').click();
}

// Handle file pick selection
function handleFileSelected(event) {
    const file = event.target.files[0];
    if (file) {
        selectedImageFile = file;
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('chatImagePreview').src = e.target.result;
            document.getElementById('chatImagePreviewBar').style.display = 'flex';
            toggleSendBtnState();
            scrollFeedToBottom();
        }
        reader.readAsDataURL(file);
    }
}

// Clear selected image preview
function clearSelectedImage() {
    selectedImageFile = null;
    document.getElementById('chatFileInput').value = '';
    document.getElementById('chatImagePreviewBar').style.display = 'none';
    document.getElementById('chatImagePreview').src = '';
    toggleSendBtnState();
}

// Submit Admin Message to backend via AJAX
function submitAdminMessage(event) {
    event.preventDefault();
    const textInput = document.getElementById('chatMessageInput');
    const message = textInput.value.trim();

    if (!message && !selectedImageFile) return;

    // Disable button and input during sending
    document.getElementById('chatSendBtn').disabled = true;

    // Prepare FormData
    const formData = new FormData();
    formData.append('user_id', activeUserId);
    if (message) formData.append('message', message);
    if (selectedImageFile) formData.append('image', selectedImageFile);
    formData.append('_token', "{{ csrf_token() }}");

    // Clear input forms
    textInput.value = '';
    clearSelectedImage();

    fetch(API_SEND, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('Send failed');
        return res.json();
    })
    .then(chat => {
        // Push chat directly into feed and scroll
        chatsData.push(chat);
        renderMessagesFeed(chatsData);
        scrollFeedToBottom();
        
        // Refresh conversations list to update snippet
        loadConversationsSilent();
    })
    .catch(err => {
        console.error('Send error', err);
        alert('Gagal mengirim pesan. Silakan coba kembali.');
    });
}

// View large attachment image
function viewLargeImage(url) {
    window.open(url, '_blank');
}

// Helper date formattings
function formatDateLabel(dateObj) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
        return 'Hari Ini';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
        return 'Kemarin';
    } else {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }
}

function formatMessageTime(dateObj) {
    let hours = dateObj.getHours().toString().padStart(2, '0');
    let minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}.${minutes}`;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
</script>
@endsection
