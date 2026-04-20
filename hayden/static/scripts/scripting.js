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
        const messageBox = document.getElementById('contact-message');
        const messageContent = messageBox.value;

        if (!_supabase) {
            alert("Database not ready. Please try again.");
            return;
        }

        let senderIp = "Unknown";
        try {
            // Fetch the user's public IP address for the sender_ip
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            senderIp = ipData.ip;
        } catch (ipErr) {
            console.warn("Could not fetch IP, proceeding as Unknown.");
        }

        // Logic for appending to the 'messages' table
        const { error } = await _supabase
            .from('messages')
            .insert([
                { 
                    recipient_name: 'Hayden', 
                    message_content: messageContent,
                    sender_ip: senderIp // Adding the fetched IP address
                    // created_at is handled by Supabase default NOW()
                }
            ]);

        if (error) {
            console.error("Error saving message:", error);
            alert("Failed to send message. Please check connection.");
        } else {
            alert("Message sent! It will be viewable in the team's protected area.");
            contactForm.reset();
        }
    });
}

// Fire initialization on load
document.addEventListener('DOMContentLoaded', init);