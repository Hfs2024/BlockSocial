const username = document.getElementById("username");
const password = document.getElementById("password");
const logInBtn = document.getElementById("logInBtn");
const toSignUpBtn = document.getElementById("signUpBtn");
const reelsBtn = document.getElementById("reelsBtn");

async function logIn() {
    if (!username.value || !password.value) return alert("Please fill in all fields!");
    const res = await fetch("/api/login", {
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
            window.location.href = "profile";
    } else {
        alert("Failed to login: " + (data.error));
    }
}

logInBtn.addEventListener("click", function () {
    logIn();
});

toSignUpBtn.addEventListener("click", function () {
    window.location.href = "signup";
});

reelsBtn.addEventListener("click", function () {
    window.location.href = 'reels';
});