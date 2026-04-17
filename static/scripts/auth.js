document.getElementById("unlock-btn").addEventListener("click", () => {
    const password = prompt("Enter password:");

    if (password === "Spring2026Lab3") {
        sessionStorage.setItem("authenticated", "true");
        window.location.href = "/protected/protected_index.html";
    } else {
        alert("Incorrect password");
    }
});