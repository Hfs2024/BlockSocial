const createPostBtn = document.getElementById("create-post-btn");
const createPostContent = document.getElementById("create-post-content");
const createPostTitle = document.getElementById("create-post-title");
const createPostKeywords = document.getElementById("create-post-keywords");
const uploadImageBtn = document.getElementById("upload-image-btn");
const uploadImageInput = document.getElementById("upload-image-input");
const postLoadBtn = document.getElementById("post-load-btn");
const postLoadFeedBtn = document.getElementById("post-load-feed-btn");
const imagePreview = document.getElementById("image-preview");
const imagePreviewContainer = document.querySelector(".image-preview-container");
const imagePreviewBtn = document.getElementById("image-preview-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const filterPostsBtn = document.querySelectorAll(".filter-posts-btn");
const filterButtons = document.querySelectorAll(".image_preview");
const toggleSlider = document.querySelector(".toggle-slider");
const toggleSliderContainer = document.querySelector(".toggle-slider-container");
const groupSelect = document.getElementById("group-select");
let wantedImage = null;
let selectedCollection = "";
let skip = 0;
let mainTitle = "";
let mainId = "";
let posts = [];
let anonymousPost = false;

toggleSliderContainer.addEventListener("click", function () {
    toggleSlider.classList.toggle("toggle-on");
    toggleSliderContainer.classList.toggle("toggle-container-on");
    if (toggleSlider.classList.contains("toggle-on")) anonymousPost = true;
    else anonymousPost = false;
});

async function renderGroupsSelect() {
    const groups = await get(`groups/?skip=none&noSkip=true`, null, false);

    groups?.content.forEach(group => {
        const option = document.createElement("option");
        option.value = group.name;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
}

renderGroupsSelect();

function filterImage(filter) {
    const isBlur = filter === "blur";
    const maxVal = isBlur ? 20 : 200;
    const unit = isBlur ? "px" : "%";
    const defaultVal = isBlur ? 0 : 100;

    Swal.fire({
        title: `Adjust ${filter}`,
        position: "bottom",
        html: `
            <div style="margin: 20px 0;">
                <input type="range" id="swal-slider" min="0" max="${maxVal}" value="${defaultVal}">
                <div id="swal-slider-value" style="margin-top: 10px; font-weight: bold;">${defaultVal}${unit}</div>
            </div>

            <button id='reset-filter'>Reset ${filter}</button>
            <button id='reset-everything'>Reset Everything</button>
        `,
        showCancelButton: true,
        cancelButtonText: "Done",
        showConfirmButton: false,
        didOpen: () => {
            const slider = document.getElementById('swal-slider');
            const output = document.getElementById('swal-slider-value');
            const resetFilter = document.getElementById("reset-filter");
            const resetEverything = document.getElementById("reset-everything");

            resetFilter.addEventListener("click", function () {
                let oldStyles = window.getComputedStyle(imagePreview).filter;
                const regex = new RegExp(`${filter}\\([^)]+\\)`);

                oldStyles = oldStyles.replace(regex, "");
                imagePreview.style.filter = oldStyles;
            })

            resetEverything.addEventListener("click", function () {
                let check = window.confirm("Are you sure you want to remove all filters?");
                if (!check) return;

                imagePreview.style.filter = "";
            })

            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                output.textContent = `${value}${unit}`;

                let oldStyles = window.getComputedStyle(imagePreview).filter;
                let applyStyles = `${filter}(${value}${unit})`;
                const regex = new RegExp(`${filter}\\([^)]+\\)`);

                oldStyles = oldStyles.replace("none", "").replace(regex, "");
                oldStyles += ` ${applyStyles} `;

                imagePreview.style.filter = oldStyles;
            });
        }
    })
}

filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
        filterImage(this.dataset.filter);
    });
});

postLoadFeedBtn.addEventListener("click", function () {
    skip = 0;

    renderPosts({
        group: groupSelect.value
    });
});

createPostBtn.addEventListener("click", async function () {
    createPost({
        title: createPostTitle.value,
        content: createPostContent.value,
        keywords: createPostKeywords.value.split(","),
        group: groupSelect.value
    });

    // Reset
    createPostTitle.value = "";
    createPostContent.value = "";
    createPostKeywords.value = "";
    wantedImage = null;
    uploadImageInput.value = "";
});

uploadImageBtn.addEventListener("click", function () {
    uploadImageInput.click();
});

uploadImageInput.addEventListener("change", async function (e) {
    const username = await get("username", null);
    if (!username) return;

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("Image file size must be less than 5MB");
        return;
    }

    uploadImageBtn.disabled = true;
    uploadImageBtn.textContent = "Waiting...";
    imagePreviewContainer.style.display = "block";
    let reader = new FileReader();
    reader.onload = () => {
        imagePreview.src = reader.result;
    }
    reader.readAsDataURL(file);

    imagePreviewBtn.addEventListener("click", async function sendImage() {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        const w = imagePreview.clientWidth;
        const h = imagePreview.clientHeight;
        canvas.width = w;
        canvas.height = h;
        const computedStyle = window.getComputedStyle(imagePreview);
        ctx.filter = computedStyle.filter ? computedStyle.filter : "";
        ctx.drawImage(imagePreview, 0, 0, w, h);
        imagePreview.src = canvas.toDataURL();

        const response = await fetch(imagePreview.src);
        const dataBuffer = await response.arrayBuffer();
        const updatedFile = new File(
            [dataBuffer],
            file.name,
            { type: file.type }
        );

        const formData = new FormData();
        formData.append("image", updatedFile);

        try {
            const response = await fetch("/multer/upload-image", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                wantedImage = data.imageUrl;
                alert("Image uploaded successfully!");
            } else {
                alert("Failed to upload image: " + data.error);
                wantedImage = null;
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading image: " + error.message);
            wantedImage = null;
        } finally {
            uploadImageBtn.disabled = false;
            uploadImageBtn.textContent = "Upload image";
            imagePreviewContainer.style.display = "none";
        }


        imagePreviewBtn.removeEventListener("click", sendImage);
    });
});

document.getElementById("add-collection-btn").addEventListener("click", function () {
    Swal.fire({
        title: 'What is the new collection name? (e.g. Sports, Cooking, etc...)',
        input: 'text',
        inputPlaceholder: 'Enter the collection\'s name...',
        showCancelButton: true,
        customClass: {
            input: "edit-input"
        }
    }).then(async (result) => {
        if (result.value) {
            const res = await fetch("/save/add/collection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: result.value
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Collection added successfully!");
                renderCollections();
            } else {
                alert("Failed to add collection: " + data.error);
            }
        }
    });
});

async function renderCollections() {
    const res = await fetch("/save/get/collections", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    if (!data.success) return;

    document.querySelector(".collections-list").innerHTML = "";
    if (data.collections?.length <= 0) document.querySelector(".collections-list").innerHTML = "<h3 style='text-align: center'>No collections yet</h3>";

    data.collections.forEach(collection => {
        const div = document.createElement("div");
        const iconRename = document.createElement("i");
        const iconDelete = document.createElement("i");

        iconDelete.className = "fas fa-trash";
        iconDelete.style.float = "right";
        iconDelete.addEventListener("click", async function (e) {
            e.stopPropagation();
            const res = await fetch("/save/delete/collection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: collection.name
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Collection was delete successfully!");
                renderCollections();
            } else {
                alert("Failed to delete this collection: " + data.error);
            }
        });

        iconRename.className = "fas fa-pencil";
        iconRename.style.float = "right";
        iconRename.addEventListener("click", function (e) {
            e.stopPropagation();
            Swal.fire({
                title: 'Rename to what?',
                input: 'text',
                inputPlaceholder: 'Enter the collection\'s new name...',
                showCancelButton: true,
                customClass: {
                    input: "edit-input"
                }
            }).then(async (result) => {
                if (result.value) {
                    const res = await fetch("/save/rename/collection", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            newName: result.value,
                            oldName: collection.name
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        alert("Collection name updated successfully!");
                        renderCollections();
                    } else {
                        alert("Failed to rename collection: " + data.error);
                    }
                }
            });
        });

        div.textContent = collection.name;
        div.appendChild(iconRename);
        div.appendChild(iconDelete);
        div.classList.add("collection-item");
        div.addEventListener("click", function () {
            selectedCollection = collection.name;

            document.querySelectorAll(".collection-item").forEach(c => c.classList.remove("selected"));

            div.classList.add("selected");
        });
        document.querySelector(".collections-list").appendChild(div);
    });
}

renderCollections();

document.querySelector("#collection-list-select-btn").addEventListener("click", async function selectCollection() {
    const res = await fetch("/save/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: mainId,
            title: mainTitle,
            saveTo: selectedCollection
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("This post was saved!");
    } else {
        alert("Failed to save this post: " + data.error);
    }

    selectedCollection = "";
    title = "";
    id = "";
    document.querySelectorAll(".collection-item").forEach(c => c.classList.remove("selected"));
    document.querySelector(".user-collections-list").style.display = "none";
});

async function savePost({
    id,
    title
} = {}) {
    document.querySelector(".user-collections-list").style.display = "block";
    mainId = id;
    mainTitle = title;
}

document.querySelector(".search-collections").addEventListener("input", () => {
    document.querySelectorAll(".collection-item").forEach(c => {
        if (c.textContent.toLowerCase().includes(document.querySelector(".search-collections").value.toLowerCase().trim())) c.style.display = "block";
        else c.style.display = "none";
    });
});

async function createPost({
    title, content, keywords, group
} = {}) {
    let mentions = content.match(/\@[a-zA-Z0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_{|}~]+/g);

    const res = await fetch("/create/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: title,
            content: content,
            image: wantedImage ? wantedImage : null,
            keywords: keywords,
            mentions: mentions ? mentions : null,
            anonymous: anonymousPost,
            group: group
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Post created!");
        renderPosts();
        anonymousPost = false;
        toggleSlider.classList.remove("toggle-on");
        toggleSliderContainer.classList.remove("toggle-container-on");
    } else {
        if (data.redirect) {
            window.location.href = data.url;
        } else {
            alert("Failed to create post: " + data.error);
        }
    }
}

prevBtn.addEventListener("click", () => {
    if (skip > 0) skip -= 50;
    renderPosts();
});

nextBtn.addEventListener("click", () => {
    if (document.getElementById("posts-container").querySelector(".no-post")) return;
    skip += 50;
    renderPosts();
});

filterPostsBtn.forEach(btn => {
    btn.addEventListener("click", function () {
        let foundOne = false;
        let type = btn.dataset.filter;
        if (!document.querySelectorAll(".post") || document.querySelectorAll(".post").length <= 0) return;

        document.querySelectorAll(".post").forEach(post => {
            let image = post.querySelector(".post-image");
            let share = post.querySelector(".share-text");
            post.style.display = "none";
            document.querySelectorAll(".no-post").forEach(no => no.remove());
            document.querySelector("#viewing-post-from-who").
                innerHTML = `
                      <h1>Viewing post from: All</h1>
                    `;

            let isImage = (type === "image" && !!image);
            let isText = (type === "text" && !image);
            let isShared = (type === "shares" && share);
            let isAll = (type === "all");

            if (isImage || isAll || isText || isShared) {
                post.style.display = "block";
                foundOne = true;
            } else {
                post.style.display = "none";
            }
        });

        if (!foundOne) {
            const h2 = document.createElement("h2");
            h2.classList.add("no-post");
            h2.style.textAlign = "center";
            h2.textContent = "No posts yet! Be the first one to post!";
            document.getElementById("posts-container").appendChild(h2);
        }
    });
});

async function renderPosts({
    customId,
    group
} = {}) {
    let api = `
        /get/posts?skip=${skip}${group ? `&group=${group}` : ""}${customId ? `&id=${customId}` : ""}
    `;

    const res = await fetch(api.trim(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    let data = await res.text();
    try {
        data = JSON.parse(data);
    } catch {
        data = data;
        return alert(data);
    }

    if (data.success) {
        document.getElementById("posts-container").innerHTML = "";

        posts = data.posts;
        if (!posts.length || posts.length <= 0) {
            const h2 = document.createElement("h2");
            h2.classList.add("no-post");
            h2.style.textAlign = "center";
            h2.textContent = "No posts yet! Be the first one to post!";
            document.getElementById("posts-container").appendChild(h2);
        }

        if (customId) {
            let post = await getCustomPost({
                id: customId
            });

            loadPost({
                posts: [...[post.post.posts[0]]],
                isViewMode: true
            });
        } else loadPost({
            posts: posts
        });
    } else {
        let confirmToRefresh = window.confirm("Failed to load data. Do you want to refresh the page?");
        if (confirmToRefresh) {
            location.reload();
        }
    }
}

renderPosts();