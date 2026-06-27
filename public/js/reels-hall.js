const container = document.querySelector(".reels-hall-container");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
let skip = 0;

prevBtn.addEventListener("click", () => {
    if (skip > 0) skip -= 10;
    container.style.display = "grid";
    renderReels();
});

nextBtn.addEventListener("click", () => {
    if (!container.querySelector(".no-post")) skip += 10;
    container.style.display = "grid";
    renderReels()
});

async function renderReels() {
    const reels = await get(`Reels/?skip=${skip}`, null, false, false, false, true);
    container.innerHTML = "";

    checkLength({
        item: reels.content,
        html: "You don't have any reels yet. Start uploading to see them here.",
        appendTo: ".reels-hall-container",
        action: () => {
            container.style.display = "block";
        }
    });

    reels.content.forEach(element => {
        const div = document.createElement("div");
        const video = document.createElement("video");
        const close = document.createElement("i");
        const btnHolder = document.createElement("div");
        const downloadBtn = document.createElement("button");
        const deleteBtn = document.createElement("button");

        downloadBtn.textContent = "Download";
        downloadBtn.className = "download-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        deleteBtn.style.marginTop = "10px"; // Because this class is used for other buttons that need margin top.
        btnHolder.className = "center-overflow";

        deleteBtn.addEventListener("click", async function () {
            const res = await fetch("/multer/delete-reel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    path: element.path,
                    id: element._id
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Reel removed!");
                location.reload();
            }
            else alert("Failed to remove reel: " + data.error);
        });

        downloadBtn.addEventListener("click", () => {
            const link = document.createElement("a");
            link.href = element.path;
            link.download = "video.mp4";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        div.classList.add("vid");

        video.src = element.path;
        video.controls = true;
        div.appendChild(video);
        btnHolder.appendChild(downloadBtn);
        btnHolder.appendChild(deleteBtn);
        div.appendChild(btnHolder);
        container.appendChild(div);
    });
}

renderReels();