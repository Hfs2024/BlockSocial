const username = document.getElementById("username");
const code = document.getElementById("code");
const password = document.getElementById("password");
const resetBtn = document.getElementById("resetBtn");

async function resetPassword({
    username,
    newPass,
    code
} = {}) {
    const res = await fetch("/forgot/reset", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            code: code,
            newPass: newPass
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Successfully reseted your password!");
        window.location.href = "/login";
    } else {
        alert("Error: " + data.error);
    }
} 

resetBtn.addEventListener("click", function () {
    resetPassword({
        username: username.value,
        newPass: password.value,
        code: code.value
    })
});