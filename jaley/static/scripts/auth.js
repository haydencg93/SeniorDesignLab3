document.addEventListener("DOMContentLoaded", () => {
    const unlockBtn = document.getElementById("unlock-btn");

    if (!unlockBtn) {
        console.error("Unlock button not found.");
        return;
    }

    unlockBtn.addEventListener("click", () => {
        const password = prompt("Enter password:");

        if (password === "Spring2026Lab3") {
            sessionStorage.setItem("authenticated", "true");
            window.location.href = "protected/protected.html";
        } else {
            alert("Incorrect password");
        }
    });
});