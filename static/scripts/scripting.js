// 1. Initialize Supabase
let _supabase;

async function initSupabase() {
    try {
        // We add a timestamp query parameter (?t=...) to the URL.
        // This "cache-buster" forces the browser to fetch the latest version 
        // of CONFIG.json instead of using a cached one from the old project.
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch('static/scripts/CONFIG.json' + cacheBuster);
        
        if (!response.ok) {
            throw new Error(`Could not load CONFIG.json: ${response.status} ${response.statusText}`);
        }
        
        const config = await response.json();
        
        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error("CONFIG.json is missing SUPABASE_URL or SUPABASE_ANON_KEY");
        }

        // Print the URL to the console so we can verify the PROJECT ID is correct
        console.log("🔗 Connecting to Supabase Project:", config.SUPABASE_URL);

        _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        
        console.log("✅ Supabase initialized successfully.");
        setupEventListeners();
    } catch (err) {
        console.error("❌ Initialization error:", err);
        const protectedArea = document.getElementById("protected-area");
        if (protectedArea) {
            const errorMsg = document.createElement("p");
            errorMsg.style.color = "#FFCD00"; 
            errorMsg.style.backgroundColor = "#000000";
            errorMsg.style.padding = "10px";
            errorMsg.innerText = "System error: Configuration could not be loaded.";
            protectedArea.appendChild(errorMsg);
        }
    }
}

// 2. Setup the Button Clicks
function setupEventListeners() {
    const unlockBtn = document.getElementById("unlock-btn");
   
    document.getElementById("hayden-btn").onclick = function() {
        window.location.href = "hayden/index.html";
    };
    document.getElementById("kaeden-btn").onclick = function() {
        window.location.href = "kaeden/index.html";
    };
    document.getElementById("jaley-btn").onclick = function() {
        window.location.href = "jaley/index.html";
    };

    if (unlockBtn) {
        // Clone and replace to prevent duplicate listeners if script reloads
        const newBtn = unlockBtn.cloneNode(true);
        unlockBtn.parentNode.replaceChild(newBtn, unlockBtn);

        newBtn.addEventListener("click", async () => {
            const password = prompt("Enter team password:");
            if (!password) return;

            newBtn.disabled = true;
            newBtn.innerText = "Verifying...";
            console.log("🚀 Calling verify-password Edge Function...");

            try {
                const { data, error } = await _supabase.functions.invoke('verify-password', {
                    body: { password: password }
                });

                if (error) {
                    console.error("🛑 Function error:", error);
                    // Helpful hint for the common 401 error
                    if (error.context?.status === 401) {
                        alert("Access Denied: Ensure 'JWT Verification' is DISABLED in the Supabase Dashboard for this function.");
                    } else {
                        alert(`System error: ${error.message}`);
                    }
                } else if (data && data.success) {
                    sessionStorage.setItem("authenticated", "true");
                    alert("✅ Access Granted!");
                    window.location.href = "protected/protected_index.html";
                } else {
                    console.warn("⚠️ Password check failed (Success: false)");
                    alert("Error: That password is not an acceptable password.");
                }
            } catch (invokeError) {
                console.error("🔥 Invocation failure:", invokeError);
                alert("Failed to reach the authentication server. Verify the function is deployed to the NEW project.");
            } finally {
                newBtn.disabled = false;
                newBtn.innerText = "Access Protected Content";
            }
        });
    }
}

// Global guard to ensure initialization only runs once
if (!window.supabaseInitStarted) {
    window.supabaseInitStarted = true;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSupabase);
    } else {
        initSupabase();
    }
}