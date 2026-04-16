document.getElementById("contact-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const messageText = document.getElementById("contact-message").value;

    let messages = JSON.parse(localStorage.getItem("messages")) || [];

    messages.push({
        text: messageText,
        timestamp: new Date().toLocaleString()
    });

    localStorage.setItem("messages", JSON.stringify(messages));

    alert("Message saved successfully!");
    this.reset();
});