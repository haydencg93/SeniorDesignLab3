/**
 * ECE:4880 Lab 3 - Protected Messages Logic
 * Fetches, filters, and displays all messages from the Supabase 'messages' table.
 */

let _supabase;
let allMessages = []; // Local cache to allow instant filtering

/**
 * Initialize Supabase using the CONFIG.json
 */
async function initInbox() {
    console.log("📂 Initializing Team Inbox...");
    try {
        const response = await fetch('../static/scripts/CONFIG.json');
        if (!response.ok) throw new Error("Could not load CONFIG.json from ../static/scripts/");
        
        const config = await response.json();
        _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        
        console.log("✅ Supabase Client initialized for Inbox.");
        
        setupFilterListeners();
        fetchMessages();
    } catch (err) {
        console.error("❌ Inbox Init Error:", err);
        const loading = document.getElementById('loading-indicator');
        if (loading) loading.innerText = "System error: Configuration file not found.";
    }
}

/**
 * Requirement #4: Fetching all messages from Supabase
 */
async function fetchMessages() {
    const table = document.getElementById('messages-table');
    const loading = document.getElementById('loading-indicator');
    const emptyState = document.getElementById('empty-state');

    console.log("📡 Fetching messages from 'messages' table...");
    if (loading) {
        loading.style.display = 'block';
        loading.innerText = "Syncing with Supabase...";
    }
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const { data, error, status } = await _supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        console.log("📦 Supabase Raw Response:", { data, error, status });

        if (error) throw error;

        allMessages = data || [];
        
        if (loading) loading.style.display = 'none';

        if (allMessages.length === 0) {
            handleEmptyState();
            return;
        }

        renderMessages(allMessages);

    } catch (err) {
        console.error("❌ Fetch Error:", err);
        if (loading) {
            loading.style.color = "#FFCD00";
            loading.innerText = "Error: Database access denied. (Check RLS Policies)";
        }
    }
}

/**
 * Handles the display logic for when 0 rows are returned
 */
function handleEmptyState() {
    const emptyState = document.getElementById('empty-state');
    console.warn("⚠️ Database returned 0 rows. Likely an RLS configuration issue.");
    
    if (emptyState) {
        emptyState.innerHTML = `
            <div style="border: 1px dashed var(--uiowa-gold); padding: 20px; border-radius: 8px;">
                <p style="font-weight: bold; color: var(--uiowa-gold);">No Messages Found</p>
                <p style="font-size: 0.9rem; margin-bottom: 15px;">The database returned an empty list.</p>
                <div style="text-align: left; background: #222; padding: 15px; font-size: 0.8rem; border-left: 4px solid #f44336;">
                    <strong>Common Fixes:</strong>
                    <ul style="margin-top: 5px;">
                        <li>Ensure messages exist in the Supabase Table Editor.</li>
                        <li><strong>Check RLS:</strong> Add a policy to 'messages' allowing SELECT for 'anon' users.</li>
                        <li>Verify that the 'recipient_name' matches exactly.</li>
                    </ul>
                </div>
                <button onclick="fetchMessages()" style="margin-top: 15px; font-size: 0.8rem;">🔄 Retry Sync</button>
            </div>
        `;
        emptyState.style.display = 'block';
    }
}

/**
 * Renders the message array to the table body
 */
function renderMessages(messagesToDisplay) {
    const table = document.getElementById('messages-table');
    const body = document.getElementById('messages-body');
    
    if (!body || !table) return;
    
    body.innerHTML = '';
    
    messagesToDisplay.forEach(msg => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #333';
        
        const date = msg.created_at ? new Date(msg.created_at).toLocaleString() : 'N/A';

        row.innerHTML = `
            <td style="padding: 12px; font-size: 0.8rem; color: var(--soft-gold);">${date}</td>
            <td style="padding: 12px; font-weight: bold; color: var(--uiowa-gold);">${msg.recipient_name || 'General'}</td>
            <td style="padding: 12px; line-height: 1.4;">${msg.message_content || '<i>Empty</i>'}</td>
            <td style="padding: 12px; font-family: monospace; font-size: 0.75rem; opacity: 0.6;">${msg.sender_ip || '---'}</td>
        `;
        body.appendChild(row);
    });

    table.style.display = 'table';
}

/**
 * Sets up filtering tabs if they exist in the HTML
 */
function setupFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            
            // UI Feedback for active tab
            filterButtons.forEach(b => b.style.opacity = '0.5');
            e.target.style.opacity = '1';

            if (filter === 'all') {
                renderMessages(allMessages);
            } else {
                const filtered = allMessages.filter(m => 
                    m.recipient_name && m.recipient_name.toLowerCase() === filter.toLowerCase()
                );
                renderMessages(filtered);
            }
        });
    });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initInbox);