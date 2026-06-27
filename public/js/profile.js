const profileContainer = document.querySelector(".profile-container");
let privatePostsFilter = false;
let anonymousPostsFilter = false;
let skip = 0;
let savesSkip = 0;

async function getPosts(api) {
    const res = await fetch(api);
    const data = await res.json();
    if (data.success) return data.content;
    else alert("Failed to get posts: " + data.error);
}

async function getProfileData() {
    const res = await fetch("/api/get/profile", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    if (data.banned) {
        profileContainer.innerHTML = `<h1>${data.error}</h1>`;
        return;
    }

    if (data.success) {
        const content = data.content;
        const div = document.createElement("div");
        profileContainer.innerHTML = "";
        let rawPosts = await getPosts(`/get/profile/post/?skip=${skip}`);
        let posts = [...[rawPosts]];
        const emojis = ['😁', '😎', '🌸', '👧🏿', '👦🏿', '🐑', '🐣', '🐔', '🧆', '🥚', '👩🏿', '👨🏿', '🍳', '🥒', '🚗', '👮', '👮‍♀️', '🕵️‍♀️', '🎅', '🤶', '✨', '🎉', '🎊', '🎀', '🎥', '🍔', '👨🏻', '👳🏻‍♂️', '👳🏻‍♀️', '👩🏻‍🦱', '😂'];

        const reportedPost = posts[0].find(post => {
            return post.reports >= 1;
        });
        if (content.theme === "black") {
            document.body.classList.add("dark");
        }

        div.innerHTML = `
          <div class='card banner' style='background-color: ${content.bannerTheme}'>
            <h1 class='user-username'>Welcome, ${content.username.split("")[0].toUpperCase() + content.username.slice(1)}!</h1>
            <div class='banner-color-container'>
                <button class='banner-color-item' style='background-color: #f36565;' data-color='#f36565'></button>
                <button class='banner-color-item' style='background-color: #9ce68d';' data-color='#9ce68d'></button>
                <button class='banner-color-item' style='background-color: #07E;' data-color='#07E'></button>
                <button class='banner-color-item' style='background-color: gray;' data-color='#505050'></button>
            </div>
            <h3><a style='color: yellow;' href='/'>Go to homepage</a><h3>
          </div>
          
          <div class='center'>
             <div class='taskbar'>
                <button class='taskbar-btn selected'>Saves</button>
                <button class='taskbar-btn'>General</button>
                <button class='taskbar-btn'>Posts</button>
                <button class='taskbar-btn'>Friends</button>
                <button class='taskbar-btn'>Others</button>
             </div>
          </div>

          ${content.reported ? "<h3 class='warning'><i class='fas fa-warning'></i> Heads up! You have been reported by some user, please make sure all your activity is legal.</h3>" : ""}

          <div class='taskbar-panel' style='display: block;'>
              <div class='saves-container'></div>
              <div class="center">
                <button id="prev-btn-saves">
                <i class="fas fa-chevron-left"></i>
                  Prev
                </button>
                <button id="next-btn-saves">
                <i class="fas fa-chevron-right"></i>
                  Next
                </button>
             </div>
          </div>

          <div class='taskbar-panel'>
            <div class='user-emoji'>${content.emoji}</div></br>
            <div class='user-emoji-panel'></div>

            <p style='font-size: 15px; font-weight: bold;'>Click to change your emoji!</p>
            <p style='font-size: 20px; font-weight: bold;'>You have <span style='color: red;'>${content.uphorses}/3</span> uphorses left. </br> Create a post with <span style='color: red;'>500</span> characters or more to get 1 more.</p>
            <p style='font-size: 20px; font-weight: bold;'>Your account was created at: </br> ${new Date(content.createdAt).toDateString()}</p>
          </div>

          <div class='taskbar-panel'>
              <div class='center-overflow'>
                <button class='toggle-private-posts'>Toggle private posts</button>
                <button class='toggle-anonymous-posts'>Toggle anonymous posts</button>
                <button class='toggle-all-posts'>Toggle all posts</button>
                <button class='export-posts'>Export all your posts</button>
              </div>
              ${reportedPost ? "<h3 class='warning'><i class='fas fa-warning'></i> Heads up! One of your posts was reported; please ensure all activity is legal.</h3>" : ""}
              <div class='user-posts'></div>
              <div class="center">
                <button id="prev-btn">
                <i class="fas fa-chevron-left"></i>
                  Prev
                </button>
                <button id="next-btn">
                <i class="fas fa-chevron-right"></i>
                  Next
                </button>
             </div>
          </div>

          <div class='taskbar-panel'>
            <div class='user-request'>
              <h3>Friend requests: </h3>
            </div>

            <div class='user-friends'>
              <h3>Your friends: </h3>
            </div>

            <div class='input-container'>
               <label for='friend-input' style='font-weight: bold; font-size: 18px; color: red;'>Add a new friend: </label></br></br>
               <input type='text' id='friend-input' placeholder="Enter friend's name..." />
               <button id='friend-submit' style='width: 100%'>Submit</button></br></br>
             </div>
          </div>

          <div class='taskbar-panel'>
              <h3 style='text-align: left;'>Image hall: </h3>
              <button onclick="window.location.href = '/hall/images'" style='width: 100%'>Go to your image hall!</button>

              <h3 style='text-align: left;'>Reels hall: </h3>
              <button onclick="window.location.href = '/hall/reels'" style='width: 100%'>Go to your reels hall!</button>

              <h3 style='text-align: left;'>Groups hall: </h3>
              <button onclick="window.location.href = '/hall/groups'" style='width: 100%'>Go to your groups hall!</button>
          </div>

          <h2 class='line-text'>Your settings: </h3>
          <div class='user-settings'>
             <label for='keywordsInput' style='font-weight: bold; font-size: 18px;'>Filter the posts you want to see:</label></br></br>
             <div class='keywords-container center'></div>
             <input type='text' id='keywordsInput' placeholder='Enter keywords...' />
             <button id='keywordSubmit' style='width: 100%'>Submit</button></br></br>
             
             <label style='font-weight: bold; font-size: 18px;'>Theme:</label>
             <button class='switchThemeBtn' style="width: 100%;">Switch to ${content.theme === "black" ? "white" : "black"}</button></br></br>
          </div>

          <div class='danger'>
            <h1>Danger zone: <h1>
            <p class='danger-p'>These actions can cause unexpected things, be aware to know everything before proceeding</h1>
            <div class='danger-btn-group'>
                <button class='logOutBtn danger-btn'>Log out</button>
                <button class='deleteAccountBtn danger-btn'>Delete account</button>
                <button class='revoke-codes danger-btn'>Revoke Recovery Codes</button>
            </div>
          </div>
        `;

        div.querySelectorAll(".banner-color-item").forEach(item => {
            if (item.dataset.color === content.bannerTheme) {
                item.classList.add("banner-color-selected");
            }

            item.addEventListener("click", async function () {
                const res = await fetch("/change-banner-color", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        color: item.dataset.color
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert("Color set!");
                    div.querySelector(".banner").style.backgroundColor = item.dataset.color;
                    div.querySelectorAll(".banner-color-selected").forEach(item => item.classList.remove("banner-color-selected"));
                    item.classList.add("banner-color-selected");
                } else {
                    alert("Failed to set color: " + data.error);
                }
            });
        })

        // Keywords
        let renderKeywords = () => {
            div.querySelector(".keywords-container").innerHTML = "";
            content.keywords.forEach(keyword => {
                const inner = document.createElement("div");
                inner.classList.add("kw");
                inner.addEventListener("contextmenu", function (e) {
                    e.preventDefault();
                    let check = window.confirm("Are you sure you want to delete this keyword?");
                    if (!check) return;

                    removeKeyword(keyword);
                    getProfileData();
                })
                inner.textContent = keyword;
                div.querySelector(".keywords-container").appendChild(inner);
            });
        }

        renderKeywords();

        checkLength({
            item: content.keywords,
            html: "Your keywords will appear here.",
            parent: div,
            appendTo: ".keywords-container"
        });

        // Emoji
        emojis.forEach(emoji => {
            let item = document.createElement("emoji");
            item.classList.add("user-emoji-panel-item");
            item.textContent = emoji;
            item.addEventListener("click", async function () {
                const res = await fetch("/emoji/update", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        emoji: emoji
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert("Emoji saved!");
                    getProfileData();
                } else {
                    alert("Failed to update your profile emoji: " + data.error);
                }
            });

            div.querySelector(".user-emoji-panel").appendChild(item)
        });

        let currentUsername = await get("username");

        // Friends
        let friendsRequestSkip = 0;
        let friendsRequest = await get("request", null, false, false, true);

        renderFriends({
            div: div
        });

        let renderFriendsRequest = () => {
            div.querySelector(".user-request").innerHTML = `<h3>Friends request: </h3>
        <div class='center'>
            <button id='friends-requests-prev-btn'><i class='fas fa-chevron-left'></i> Prev</button>
            <button id='friends-requests-next-btn'><i class='fas fa-chevron-right'></i> Next</button>
        </div>`;

            div.querySelector(".user-request").querySelector("#friends-requests-prev-btn").addEventListener("click", async function () {
                if (friendsRequestSkip > 0) friendsRequestSkip -= 10;
                friendsRequest = await get(`request?skip=${friendsRequestSkip}`, null, false, false, true);
                renderFriendsRequest();
            });

            div.querySelector(".user-request").querySelector("#friends-requests-next-btn").addEventListener("click", async function () {
                if (div.querySelector(".user-request").querySelector(".no-post")) return;

                friendsRequestSkip += 10;
                friendsRequest = await get(`request?skip=${friendsRequestSkip}`, null, false, false, true);
                renderFriendsRequest();
            });

            checkLength({
                item: friendsRequest.request,
                html: 'You don\'t have any friend requests yet.',
                parent: div,
                appendTo: ".user-request"
            });

            friendsRequest.request.forEach(request => {
                const inner = document.createElement("div");
                inner.classList.add("card");
                inner.innerHTML = `
              <h3>${request.sender}</h3>
              <div class='center'>
                 <button class='accept-friend-btn friend-button'>Accept</button>
                 <button class='reject-friend-btn friend-button'>Reject</button>
              </div>
            `;

                inner.querySelector(".accept-friend-btn").addEventListener("click", function () {
                    friendAction({
                        type: "accept",
                        name: request.sender
                    });
                    getProfileData();
                });

                inner.querySelector(".reject-friend-btn").addEventListener("click", function () {
                    friendAction({
                        type: "reject",
                        name: request.sender
                    });
                    getProfileData();
                })

                div.querySelector(".user-request").appendChild(inner);
            });
        }

        renderFriendsRequest();

        div.querySelector("#friend-submit").addEventListener("click", function () {
            requestFriend({
                name: div.querySelector("#friend-input").value
            });

            div.querySelector("#friend-input").value = ""; // Clear
        });

        const prevBtn = div.querySelector("#prev-btn");
        const nextBtn = div.querySelector("#next-btn");
        let resetFilters = () => {
            privatePostsFilter = false;
            anonymousPostsFilter = false;
            div.querySelector(".toggle-anonymous-posts")?.classList.remove("active");
            div.querySelector(".toggle-private-posts")?.classList.remove("active");
        }

        prevBtn.addEventListener("click", async () => {
            if (skip > 0) skip -= 50;
            rawPosts = await getPosts(`/get/profile/post/?skip=${skip}`);
            posts = [...[rawPosts]];
            resetFilters();
            renderPosts();
        });

        nextBtn.addEventListener("click", async () => {
            if (div.querySelector(".user-posts").querySelector(".no-post")) return;
            skip += 50;
            rawPosts = await getPosts(`/get/profile/post/?skip=${skip}`);
            posts = [...[rawPosts]];
            resetFilters();
            renderPosts();
        });

        document.querySelector(".profile-container").appendChild(div);

        let saves = await get(`saves/?skip=${savesSkip}`, null, false, true);

        let renderSaves = () => {
            div.querySelector(".saves-container").innerHTML = "";
            checkLength({
                item: saves.data,
                html: "You don't have any collections yet!",
                parent: div,
                appendTo: ".saves-container"
            });

            saves.data.forEach(save => {
                const inner = document.createElement("div");
                inner.className = "card";
                inner.style.cssText = `
              margin: 0;
              margin-top: 20px;
              width: 100%;
              height: auto;
              max-height: 400px;
              overflow: auto;
              text-align: left;
            `
                inner.innerHTML = `
               <h1>${save.name}</h1>
               <input type='text' placeholder='Search saves...' class='search-saves-input' />         
               <div class='saves-inner-container'></div>
            `;

                checkLength({
                    item: save.saves,
                    html: "You don't have any saves in this collection yet!",
                    parent: inner,
                    appendTo: ".saves-inner-container"
                });

                save.saves.forEach(card => {
                    let saveCard = document.createElement("div");
                    saveCard.innerHTML = `
                          <i class='fas fa-pencil rename-save-btn'></i>
                          <i class='fas fa-trash remove-save-btn'></i>
                          </br>
                          <p class='saves-title'>${card.title}</p>
                    `;

                    saveCard.classList.add("save-card");
                    saveCard.classList.add("card-light");

                    saveCard.querySelector(".rename-save-btn").addEventListener("click", async function (e) {
                        e.stopPropagation();
                        Swal.fire({
                            title: "Rename to what?",
                            input: "text",
                            showCancelButton: true,
                            inputPlaceholder: "Enter new name...",
                            customClass: {
                                input: "edit-input"
                            }
                        }).then(result => {
                            if (result.value) {
                                renameSave({
                                    saveId: save._id,
                                    cardId: card._id,
                                    newName: result.value
                                });
                            }
                        });
                    });

                    saveCard.querySelector(".remove-save-btn").addEventListener("click", async function (e) {
                        e.stopPropagation();
                        let check = window.confirm("Are you sure you want to delete?");
                        if (!check) return;

                        const res = await fetch(`/save/delete/collection/item`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                collection: save.name,
                                id: card._id
                            })
                        });

                        const data = await res.json();
                        if (!data.success) return alert("Failed to delete this item: " + data.error);
                        alert("Removed successfully!");
                        getProfileData();
                    });

                    saveCard.addEventListener("click", async function () {
                        let post = await getCustomPost({
                            id: card.id
                        });

                        if (!post.post) return alert("Post not found!");

                        loadPost({
                            posts: [...[post.post]],
                            isViewMode: true,
                            saver: true
                        });
                    });

                    inner.querySelector(".saves-inner-container").appendChild(saveCard);
                });

                inner.querySelector(".search-saves-input").addEventListener("input", function () {
                    inner.querySelector(".saves-inner-container").querySelectorAll(".save-card").forEach(card => {
                        let text = card.querySelector(".saves-title").textContent.trim().toLowerCase();
                        if (text.includes(inner.querySelector(".search-saves-input").value.trim().toLowerCase())) card.style.display = "block";
                        else card.style.display = "none";
                    });
                });

                div.querySelector(".saves-container").appendChild(inner);
            });
        }

        renderSaves();

        div.querySelector("#prev-btn-saves").addEventListener("click", async () => {
            if (savesSkip > 0) savesSkip -= 50;
            saves = await get(`saves/?skip=${savesSkip}`, null, false, true);
            renderSaves();
        });

        div.querySelector("#next-btn-saves").addEventListener("click", async () => {
            savesSkip += 50;
            saves = await get(`saves/?skip=${savesSkip}`, null, false, true);
            renderSaves();
        });

        div.querySelector(".toggle-anonymous-posts").addEventListener("click", function () {
            if (div.querySelector(".user-posts").querySelector(".no-post")) div.querySelector(".user-posts").querySelector(".no-post").remove();

            toggle({
                filter: anonymousPostsFilter,
                toggle: "anonymous",
                el: div
            });
        });

        div.querySelector(".toggle-all-posts").addEventListener("click", function () {
            if (div.querySelector(".user-posts").querySelector(".no-post")) div.querySelector(".user-posts").querySelector(".no-post").remove();

            toggle({
                el: div,
                all: true,
                renderPosts: renderPosts
            });
        })

        div.querySelector(".toggle-private-posts").addEventListener("click", function () {
            toggle({
                filter: privatePostsFilter,
                toggle: "private",
                el: div
            });
        });

        div.querySelectorAll(".taskbar-btn").forEach((taskbar, index) => {
            taskbar.addEventListener("click", function () {
                div.querySelectorAll(".taskbar-panel").forEach(panel => panel.style.display = "none");
                div.querySelectorAll(".taskbar-btn").forEach(btn => btn.classList.remove("selected"));
                taskbar.classList.add("selected");
                div.querySelectorAll(".taskbar-panel")[index].style.display = "block";
            });
        });

        div.querySelector(".export-posts").addEventListener("click", async function () {
            let count = window.prompt("How many posts do you want to export? (Min 15, Max 300)");
            if (!count) return;

            const res = await fetch("/export/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    count: count
                })
            });

            let data = await res.json();
            if (!data.success) return alert("Failed to export your posts: " + data.error);

            let confirmToDownload = window.confirm("Done! You can now click OK to download your posts");
            if (confirmToDownload) {
                let a = document.createElement("a");
                let buffer = [];
                data.posts.forEach(post => {
                    buffer.push(`${JSON.stringify(post)}\n`)
                });

                const blob = new Blob([buffer.join("")], { type: 'application/json' });
                let download = URL.createObjectURL(blob);
                a.href = download;
                a.download = `${content.username}_posts.jsonl`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(download);
            }
        });

        div.querySelector(".revoke-codes").addEventListener("click", async function () {
            const res = await fetch("/forgot/revoke", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: content._id
                })
            });

            const data = await res.json();
            if (data.success) {
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
            } else {
                alert("Failed to revoke your old codes: " + data.error);
            }
        });

        div.querySelector("#keywordSubmit").addEventListener("click", async () => {
            const content = div.querySelector("#keywordsInput").value.split(",").slice(0, 5).filter(Boolean);
            if (!content || content.length <= 0) return alert("Please enter some keywords!");

            const res = await fetch("/api/keywords", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keywords: content
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Great, you will start seeing posts related to ${div.querySelector("#keywordsInput").value}`);
                getProfileData();
            } else {
                alert("Failed to add keywords: " + data.error);
            }

            div.querySelector("#keywordsInput").value = "";
        });

        div.querySelector(".switchThemeBtn").addEventListener("click", async function () {
            const res = await fetch("/api/change/theme", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await res.json();
            if (data.success) {
                location.reload();
            } else {
                alert("Failed to change theme. Try again.");
            }
        });

        div.querySelector(".deleteAccountBtn").addEventListener("click", async function () {
            let condfirmToDelete = window.prompt("Type your username in the prompt to close your account (This can't be reversed): ");

            if (!condfirmToDelete) return;
            let username = await get("username");
            if (condfirmToDelete === username.username) {
                const res = await fetch("/api/delete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                const data = await res.json();
                if (data.success) {
                    alert("Account deleted successfully! Your data is being deleted in the background.");
                    location.reload();
                } else {
                    alert("Failed to delete: " + data.error);
                }
            } else {
                let confirmToRetry = window.confirm("Wrong username. Make sure you type everything correctly. Do you want to try again?");
                if (confirmToRetry) {
                    div.querySelector(".deleteAccountBtn").click();
                }
            }
        });

        div.querySelector(".logOutBtn").addEventListener("click", async function () {
            const res = await fetch("/api/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await res.json();
            if (data.success) {
                window.location.href = data.url;
            } else {
                alert("Failed to logout but don't worry, you will be auto logout on page close");
            }
        });

        let renderPosts = () => {
            div.querySelector(".user-posts").innerHTML = "";

            checkLength({
                item: posts[0],
                html: "You don't have any posts yet. Make one <a href='/'>here</a>",
                parent: document,
                appendTo: ".user-posts"
            });

            posts[0].forEach(post => {
                const inner = document.createElement("div");
                inner.classList.add("card");
                inner.classList.add("user-post");
                inner.innerHTML = `
              <div class='center' style='gap: 15px; justify-content: flex-start; max-width: 100%; overflow: auto;'>
                <button style='width: 100%' class='edit-btn'>Edit</button>
                <button style='width: 100%' class='delete-btn'>Delete</button>
                ${!post.anonymous ? "<button style='width: 100%' class='set-private-btn'>Toggle private</button>" : ""}
              </div>
              <h1>${post.title}</h1>
              ${post.image ? `<img style='border: 2px solid #ccc; width: 100%; height: 100%; border-radius: 20px' src='${post.image}'/>` : ""}
              <p>${post.content}<p>
              ${!post.anonymous ? `
                <p>Is this post private: <span class='private-text'>${post.private ? "Yes" : "No"}</span></p>   
              ` : `
                <p>Is this post anonymous: <span class='anonymous-text'>${post.anonymous ? "Yes" : "No"}</span></p>
              `}
              <div class='options'>
                <p class='count'>Likes: ${post.likes}</p>
                <p class='count'>Downloads: ${post.downloads}</p>
                <p class='count'>Reports: ${post.reports}</p>
                <p class='count'>Comments: ${post.commentsCount}</p>
              </div>
            `;

                if (inner.querySelector(".set-private-btn")) inner.querySelector(".set-private-btn").addEventListener("click", async function () {
                    const res = await fetch("/set/private/post", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            id: post._id,
                            value: post.private ? false : true
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        alert(`Post is ${post.private ? "not private" : "private"} now`);
                        getProfileData();
                    } else {
                        alert(`Failed to set post as ${post.private ? "not private" : "private"}: ${data.error}`);
                    }
                });

                inner.querySelector(".delete-btn").addEventListener("click", async function () {
                    const res = await fetch("/actions/delete/post", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            id: post._id
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        Swal.fire("Post deleted!");
                        getProfileData();
                    } else {
                        Swal.fire("Failed to deleted post: ", data.error);
                    }
                });

                inner.querySelector(".edit-btn").addEventListener("click", async function () {
                    Swal.fire({
                        title: 'Enter the new content',
                        input: 'text',
                        inputPlaceholder: 'Enter new content...',
                        showCancelButton: true,
                        customClass: {
                            input: "edit-input"
                        }
                    }).then(async (result) => {
                        if (result.value) {
                            const res = await fetch("/actions/update/post", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    id: post._id,
                                    newContent: result.value
                                })
                            });

                            const data = await res.json();
                            if (data.success) {
                                Swal.fire("Post updated!");
                                getProfileData();
                            } else {
                                Swal.fire("Failed to update post: ", data.error);
                            }
                        }
                    });
                });

                div.querySelector(".user-posts").appendChild(inner);
            });
        }

        renderPosts();
    }
}
getProfileData();
