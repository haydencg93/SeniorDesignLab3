// Hayden's Portfolio Scripting
// Handles: Supabase Init and Contact Form Submissions

let _supabase;

/**
 * Initialize Supabase using the shared CONFIG.json
 */
async function init() {
    try {
        // Path assumes CONFIG.json is in static/scripts/ relative to the site root
        // From hayden/static/scripts/, we go up two levels to find the shared assets
        const response = await fetch('../static/scripts/CONFIG.json');
        if (!response.ok) throw new Error("Could not load configuration.");
        
        const config = await response.json();
        _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        
        console.log("Supabase linked to Hayden's Profile.");
        setupForms();
    } catch (err) {
        console.error("Initialization error:", err);
    }
}

/**
 * Requirement #4: Contact Form Logic
 * Saves messages to the 'messages' table with recipient, content, and sender IP.
 */
function setupForms() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameBox = document.getElementById('contact-name');
        const emailBox = document.getElementById('contact-email');
        const messageBox = document.getElementById('contact-message');

        if (!_supabase) {
            alert("Database not ready. Please try again.");
            return;
        }

        // Removed IP fetching logic entirely for privacy/cleaning
        const { error } = await _supabase
            .from('messages')
            .insert([
                { 
                    recipient_name: 'Hayden', 
                    sender_name: nameBox.value,
                    sender_email: emailBox.value,
                    message_content: messageBox.value
                    // sender_ip removed
                }
            ]);

        if (error) {
            console.error("Error saving message:", error);
            alert("Failed to send message.");
        } else {
            alert("Message sent!");
            contactForm.reset();
        }
    });
}

// Fire initialization on load
document.addEventListener('DOMContentLoaded', init);