import { getUserTheme } from "/js/theme.js";
getUserTheme(
    document.querySelector(".input-container")
);

const uploadBtn = document.getElementById("json-upload-btn");
const uploadInput = document.getElementById("upload-input");

uploadBtn.addEventListener("click", function () {
    uploadInput.click();
});

uploadInput.addEventListener("change", async function (e) {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("JSONFile", file);

    const res = await fetch("/upload/", {
        method: "POST",
        headers: {
            "Contnet-Type": "application/json"
        },
        body: formData
    });

    const data = await res.json();

    if (data.success) {
        alert("Data uploaded!");
    } else {
        alert("Failed to upload file: " + data.error);
    }

    location.reload();
});
