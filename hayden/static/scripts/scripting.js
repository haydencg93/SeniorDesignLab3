/**
 * Hayden's Portfolio Scripting
 * Enhanced with Scroll Animations & Better Form UX
 */

let _supabase;

/**
 * Initialize Supabase and UI Features
 */
async function init() {
    try {
        const response = await fetch('../static/scripts/CONFIG.json');
        if (!response.ok) throw new Error("Could not load configuration.");
        
        const config = await response.json();
        _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        
        console.log("Supabase linked successfully.");
        setupForms();
        initAnimations();
    } catch (err) {
        console.error("Initialization error:", err);
        // Fallback for animations even if DB fails
        initAnimations();
    }
}

/**
 * Scroll Reveal Animations
 */
function initAnimations() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Contact Form UX Logic
 */
function setupForms() {
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameBox = document.getElementById('contact-name');
        const emailBox = document.getElementById('contact-email');
        const messageBox = document.getElementById('contact-message');

        if (!_supabase) {
            alert("Connection error. Please try again later.");
            return;
        }

        // UX: Loading state
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "SENDING...";
        submitBtn.disabled = true;

        const { error } = await _supabase
            .from('messages')
            .insert([
                { 
                    recipient_name: 'Hayden', 
                    sender_name: nameBox.value,
                    sender_email: emailBox.value,
                    message_content: messageBox.value
                }
            ]);

        if (error) {
            console.error("Error saving message:", error);
            submitBtn.innerText = "ERROR!";
            submitBtn.style.background = "#ff4444";
            
            setTimeout(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = "";
            }, 3000);
        } else {
            // Success UX
            submitBtn.innerText = "MESSAGE SENT!";
            submitBtn.style.background = "#ffffff";
            submitBtn.style.color = "#000000";
            
            contactForm.reset();

            setTimeout(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = "";
                submitBtn.style.color = "";
            }, 5000);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);