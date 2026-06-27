import { getUserTheme } from "/js/theme.js";
getUserTheme();

const reelsContainer = document.querySelector(".reels-container");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
let skip = 0;
let isFilterAdded = false;

prevBtn.addEventListener("click", () => {
    if (skip > 0) skip -= 50;
    getReels();
});

nextBtn.addEventListener("click", () => {
    skip += 50;
    getReels();
});

uploadBtn.addEventListener("click", function () {
    fileInput.click();
});

fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    uploadReels(file);
});

async function uploadReels(file) {
    let formData = new FormData();
    formData.append("myFile", file);
    const res = await fetch("/multer/upload", {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    if (data.success) {
        alert("Video uploaded!");
        getReels();
    } else {
        alert("Failed to upload reel: " + data.error);
    }
}

async function reelAction({
    id,
    messages = [],
    api,
    panel
}) {
    if (!Array.isArray(messages)) return alert("Message is not an array bro 😅.");

    const res = await fetch(`/multer/reel/${api}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: id
        })
    });

    const data = await res.json();
    if (data.success) {
        alert(messages[0]);
        if (api === "like") panel.querySelector(".likes-count").textContent = data.likes;
        if (api === "report") panel.querySelector(".reports-count").textContent = data.reports;
    }
    else alert(`Failed to ${messages[1]} this reel: ` + data.error);
}

async function getReels() {
    const res = await fetch(`/multer/api/get/uploads/?skip=${skip}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    if (data.success) {
        const reels = data.content;

        if (reels.length === 0) {
            reelsContainer.innerHTML = "<div class='card'><h2 style='text-align: center'>No reels uploaded yet.</h2></div>";
            return;
        }
        reelsContainer.innerHTML = "";
        reels.forEach(async reel => {
            let emoji = await get(`emoji/other_user/?username=${reel.by}`, null, false);

            const div = document.createElement("div");
            const panel = document.createElement("div");
            div.classList.add("reels-card");
            panel.innerHTML = ` 
            <div class='reel-username'>
              Created By:
              ${emoji?.emoji || ""}
              <span class='createdBy'>${reel?.by}</span>
            </div>
            
            <div class='likes-reel-panel'>
               <i class='fas fa-thumbs-up like-reel'></i>
               <p class='likes-count'>${reel.likes}</p>
            </div>

            <div class='likes-reel-panel'>
               <i class='fas fa-warning report-reel'></i>
               <p class='reports-count'>${reel.reports}</p>
            </div>`;
            panel.classList.add("panel-reel");

            panel.querySelector(".like-reel").addEventListener("click", async function () {
                reelAction({
                    id: reel._id,
                    messages: ["Liked!", "like"],
                    api: "like",
                    panel: panel
                });
            });

            panel.querySelector(".report-reel").addEventListener("click", function () {
                reelAction({
                    id: reel._id,
                    messages: ["Reported!", "report"],
                    api: "report",
                    panel: panel
                });
            });

            panel.querySelector(".reel-username").addEventListener("click", function () {
                if (isFilterAdded) {
                    document.querySelectorAll(".reels-card").forEach(card => {
                        card.style.display = "block";
                        panel.querySelector(".reel-username").classList.remove("user-reel-username-on");
                    });
                    isFilterAdded = false;
                } else {
                    document.querySelectorAll(".reels-card").forEach(card => {
                        if (card.querySelector(".createdBy").textContent === reel.by) {
                            panel.querySelector(".reel-username").classList.add("user-reel-username-on");
                            card.style.display = "block";
                        } else {
                            card.style.display = "none";
                        }
                    });

                    isFilterAdded = true;
                }
            });

            const video = document.createElement("video");
            video.src = reel.path;
            video.controls = true;
            div.appendChild(video);
            div.appendChild(panel);
            reelsContainer.appendChild(div);
        });
    } else {
        let condfirmToRefresh = confirm("Failed to load reels. Do you want to refresh the page?");
        if (condfirmToRefresh) {
            location.reload();
        }
    }
}

getReels();