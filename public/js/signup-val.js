const username = document.getElementById("username");
const password = document.getElementById("password");
const email = document.getElementById("email");
const bio = document.getElementById("bio");
const signUpBtn = document.getElementById("signUpBtn");
const toSignUpBtn = document.getElementById("toSignUpBtn");
const reelsBtn = document.getElementById("reelsBtn");

async function signUp() {
    if (!username.value || !password.value || !email.value || !bio.value) return alert("Please fill in all fields!");
    const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value,
            email: email.value,
            bio: bio.value
        })
    });

    const data = await res.json();
    if (data.success) {
        if (data.codes) {
            const confirmToDownloadCodesAsTxt = confirm("Your backup codes are ready! Do you want to download them as a text file? If you choose no, you won't be able to see them again, so make sure to save them somewhere safe!");
            if (confirmToDownloadCodesAsTxt) {
                const element = document.createElement('a');
                const file = new Blob([data.codes.map(code => code).join("\n")], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = "backup-codes.txt";
                document.body.appendChild(element);
                element.click();
            } else {
                alert("Your backup codes: " + data.codes.map(code => code).join(", "));
            }

            window.location.href = "profile";
        }
    } else {
        alert("Failed to signup: " + (data.error));
    }
}

signUpBtn.addEventListener("click", function () {
    signUp();
});

toSignUpBtn.addEventListener("click", function () {
    window.location.href = "signup";
});

reelsBtn.addEventListener("click", function () {
    window.location.href = 'reels';
});