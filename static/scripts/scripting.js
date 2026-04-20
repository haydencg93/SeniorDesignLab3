/**
 * ECE:4880 Lab 3 - Main Portfolio Logic
 * Handles Supabase initialization and Edge Function-based authentication.
 */

let _supabase;

/**
 * Initialize Supabase using the local CONFIG.json file.
 * Expects the file at 'static/scripts/CONFIG.json'.
 */
async function initSupabase() {
    try {
        const response = await fetch('static/scripts/CONFIG.json');
        
        if (!response.ok) {
            throw new Error(`Could not load CONFIG.json: ${response.status} ${response.statusText}`);
        }
        
        const config = await response.json();
        
        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error("CONFIG.json is missing required SUPABASE_URL or SUPABASE_ANON_KEY");
        }

        // Initialize the client
        _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        
        console.log("✅ Supabase initialized successfully.");
        setupEventListeners();
    } catch (err) {
        console.error("❌ Initialization error:", err);
        displayUIError("System configuration error. Check console for details.");
    }
}

/**
 * Requirement #3 & #2: UI Visual Feedback
 * Displays a styled error message if the setup fails.
 */
function displayUIError(msg) {
    const protectedArea = document.getElementById("protected-area");
    if (protectedArea) {
        const errorMsg = document.createElement("p");
        errorMsg.style.color = "#FFCD00"; // UIowa Gold
        errorMsg.style.backgroundColor = "#000000"; // UIowa Black
        errorMsg.style.padding = "10px";
        errorMsg.style.borderRadius = "4px";
        errorMsg.style.marginTop = "15px";
        errorMsg.innerText = msg;
        protectedArea.appendChild(errorMsg);
    }
}

/**
 * Attaches the click listener to the unlock button.
 * Uses a cloning method to ensure no duplicate listeners are attached.
 */
function setupEventListeners() {
    const unlockBtn = document.getElementById("unlock-btn");
    
    if (unlockBtn) {
        // Remove existing listeners by cloning the node
        const newBtn = unlockBtn.cloneNode(true);
        unlockBtn.parentNode.replaceChild(newBtn, unlockBtn);

        newBtn.addEventListener("click", async () => {
            const password = prompt("Enter team password:");
            if (!password) return;

            // Visual feedback: Disable button and show loading state
            newBtn.disabled = true;
            const originalText = newBtn.innerText;
            newBtn.innerText = "Verifying...";
            
            console.log("🚀 Calling verify-password Edge Function...");

            try {
                // Call the Edge Function 'verify-password'
                const { data, error } = await _supabase.functions.invoke('verify-password', {
                    body: { password: password }
                });

                // --- DEBUGGING LOGS ---
                console.log("📦 Full Response Data:", data);
                
                if (error) {
                    console.error("🛑 Edge Function Error Object:", error);
                    
                    // Handle 401 Unauthorized specifically
                    if (error.context?.status === 401) {
                        console.error("🛑 AUTH ERROR: 401 Unauthorized.");
                        console.info("💡 FIX: Go to Supabase Dashboard > Functions > verify-password > Settings.");
                        console.info("💡 ACTION: Uncheck 'Enforce JWT Verification' and Save.");
                        alert("Permission Error: JWT Verification is enabled on the server. Please follow the instructions in the browser console to fix this in your Supabase Dashboard.");
                    } else if (error.name === 'FunctionsFetchError') {
                        alert("CORS Error: The Edge Function failed the preflight check. Ensure OPTIONS is handled correctly in index.ts.");
                    } else {
                        alert(`System Error: ${error.message || "Failed to reach function"}`);
                    }
                } else if (data && data.success) {
                    // Requirement #2: Persist session to avoid repeated prompts
                    sessionStorage.setItem("authenticated", "true");
                    alert("✅ Access Granted!");
                    // Ensure the path is relative to the current index.html
                    window.location.href = "protected/protected_index.html";
                } else if (data && data.error === 'Worker is not defined') {
                    // Specific handler for the bcrypt library compatibility issue
                    console.error("🛑 SERVER ERROR: Incompatible bcrypt library detected.");
                    console.info("💡 FIX: Your Edge Function index.ts must use 'bcryptjs' via esm.sh.");
                    alert("Critical Server Error: Server-side auth library mismatch. Check console for the code fix.");
                } else {
                    // Default logic for incorrect password
                    console.warn("⚠️ Authentication Failed: Incorrect password provided.");
                    alert("Error: That password is not an acceptable password.");
                }
            } catch (invokeError) {
                console.error("🔥 Invocation Critical Failure:", invokeError);
                alert("Failed to reach the authentication server. Ensure the function is deployed.");
            } finally {
                // Restore button state
                newBtn.disabled = false;
                newBtn.innerText = originalText;
            }
        });
    } else {
        console.error("Button 'unlock-btn' not found in HTML.");
    }
}

// Global guard to ensure initialization only runs once per page load
if (!window.supabaseInitStarted) {
    window.supabaseInitStarted = true;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSupabase);
    } else {
        initSupabase();
    }
}