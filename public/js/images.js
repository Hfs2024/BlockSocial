const container = document.querySelector(".image-hall-container");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const viewFavImg = document.querySelector(".view-fav-image");
let skip = 0;
let isFavFilterAdded = false;

prevBtn.addEventListener("click", () => {
    if (skip > 0) skip -= 10;
    container.style.display = "grid";
    renderImages();
    isFavFilterAdded = false;
});

nextBtn.addEventListener("click", () => {
    if (!container.querySelector(".no-post")) skip += 10;
    container.style.display = "grid";
    renderImages();
    isFavFilterAdded = false;
});

viewFavImg.addEventListener("click", function () {
    if (isFavFilterAdded) {
        document.querySelectorAll(".image").forEach(image => {
            image.style.display = "block";
        });

        isFavFilterAdded = false;
        return;
    }

    document.querySelectorAll(".image").forEach(image => {
        const isFav = image.querySelector(".image-fav-yes-no").textContent === "Yes" ? true : false;
        image.style.display = isFav ? "block" : "none";
    });

    isFavFilterAdded = true;
})

async function imageAction({
    path,
    id,
    messages,
    action,
    value
}) {
    if (!action || !id) return alert("And why to miss? 🧃");
    if (!Array.isArray(messages)) return alert("Messages must be an array bro 🍚.");

    const res = await fetch(`/multer/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            path: path,
            id: id,
            value: value
        })
    });

    const data = await res.json();
    if (data.success) {
        alert(messages[0] || "Done!");
        renderImages();
    }
    else alert(`${messages[1] || "Failed"}: ${data.error}`);
}

async function renderImages() {
    const images = await get(`Images/?skip=${skip}`, null, false, false, false, true);
    container.innerHTML = "";

    checkLength({
        item: images.content,
        html: "You don't have any images yet. Start uploading to see them here.",
        appendTo: ".image-hall-container",
        action: () => {
            container.style.display = "block";
        }
    });

    images.content.forEach(element => {
        const div = document.createElement("div");
        div.classList.add("image");

        div.innerHTML = `
        <button class="addImgToFavBtn"><i class='fas fa-heart'></i> Toggle to fav</button>
        <p class='image-fav-text'>Favorite: <span class='image-fav-yes-no'>${element.fav ? "Yes" : "No"}</span></p>
        <img src="${element.path}">
        <div class="center-overflow">
            <button class="download-btn">Download</button>
            <button class="delete-btn" style="margin-top: 10px;">Delete</button>
        </div>
    `;

        div.querySelector(".addImgToFavBtn").addEventListener("click", function () {
            imageAction({
                path: null,
                value: !element.fav,
                id: element._id,
                messages: [element.fav ? "Removed from favorites" : "Added to favorites!", "Failed to add to favorites"],
                action: "addToFav"
            });
        });

        div.querySelector(".delete-btn").addEventListener("click", async function () {
            imageAction({
                path: element.path,
                value: null,
                id: element._id,
                messages: ["Image removed!", "Failed to remove image"],
                action: "delete-image"
            });
        });

        div.querySelector(".download-btn").addEventListener("click", () => {
            const link = document.createElement("a");
            link.href = element.path;
            link.download = "image.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        container.appendChild(div);
    });
}

renderImages();