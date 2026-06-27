const username = document.getElementById("username");
const password = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const query = new URLSearchParams(window.location.search);
const banPanel = query.get("banPanel");

submitBtn.addEventListener("click", async function () {
    const res = await fetch(`/private/admin/login/?banPanel=${banPanel}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    const data = await res.json();
    if (data.success) {
        window.location.href = data.url;
    } else {
        alert(`Error: ${data.error}`);
    }
});