let selectedShareFriend = "";

async function sendAction({
    el,
    type,
    id
} = {}) {
    const res = await fetch(`/api/${type}`, {
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
        setCountsDisplay({
            el: el,
            reports: data.reports,
            downloads: data.downloads,
            uphorses: data?.uphorses,
            likes: data.likes
        });
    } else {
        if (data.redirect) {
            window.location.href = data.url;
        } else {
            alert(`Failed to ${type} post: ` + data.error);
        }
    }
}

async function sendComment({
    id,
    comment,
    el
} = {}) {
    const res = await fetch("/api/comment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: id,
            comment: comment
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Comment created!");
        setCountsDisplay({
            el: el,
            comments: data.commentsCount
        });

        renderComments({
            el: el,
            comments: data.comments
        });
    } else {
        if (data.redirect) {
            window.location.href = data.url;
        } else {
            alert("Failed to comment: " + data.error);
        }
    }
}

async function downloadPost({
    el,
    title,
    id
}) {
    const res = await fetch("/api/download", {
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
        html2canvas(el).then(canvas => {
            const link = document.createElement("a");
            link.download = `${title}.png`;
            link.href = canvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        setCountsDisplay({
            el: el,
            downloads: data.downloads
        });
    } else {
        if (data.redirect) {
            window.location.href = data.url;
        } else {
            alert("Failed to download post: " + data.error);
        }
    }
}

function setCountsDisplay({
    el,
    likes,
    reports,
    comments,
    downloads,
    uphorses
}) {
    const elements = el instanceof NodeList ? el : [el];

    elements.forEach(div => {
        if (likes !== undefined) div.querySelector(".post-likes-count").textContent = likes;
        if (downloads !== undefined) div.querySelector(".post-downloads-count").textContent = downloads;
        if (comments !== undefined) div.querySelector(".post-comments-count").textContent = comments;
        if (reports !== undefined) div.querySelector(".post-reports-count").textContent = reports;
        if (uphorses !== undefined) div.querySelector(".post-uphorse-count").textContent = uphorses;
    });
}

async function getComments(posts, skip) {
    try {
        posts = JSON.parse(posts);
    } catch {
        posts = posts;
    }

    const res = await fetch("/api/get/comments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            posts: posts,
            skip: skip
        })
    });

    const data = await res.json();
    if (data.success) return data.fullComments;
    else alert("Failed to get comments!");
}

async function friendAction({
    type,
    name
}) {
    const res = await fetch(`/friends/action/${type}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name
        })
    });

    const data = await res.json();
    if (data.success) {
        alert(`Friend ${type !== "remove" ? `${type}ed` : `${type}d`}`);
    } else {
        alert(`Failed to ${type} this friend: ${data.error}`);
    }
}

function renderComments({
    comments,
    el,
    check = true
}) {
    if ((comments.length <= 0) && check) {
        el.querySelector(".comment-prev-btn").style.display = "none";
        el.querySelector(".comment-next-btn").style.display = "none";
    } else {
        el.querySelector(".comment-prev-btn").style.display = "block";
        el.querySelector(".comment-next-btn").style.display = "block";
    }


    el.querySelector(".comment-list").innerHTML = comments.map(comment => {
        return `
                  <div class='comment-list-card'><span style='color: lightgreen;'>${comment.by}</span>: ${comment.comment}</div>
                `;
    }).join(" ");

    el.querySelector(".comment-list").scrollTo({
        top: el.scrollHeight,
        behavior: "smooth"
    });
}

async function sharePost({
    id,
    shareTo,
    comment
}) {
    const res = await fetch("/api/share", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: id,
            shareTo: shareTo,
            comment: comment
        })
    });

    const data = await res.json();
    if (data.success) alert("Post shared!");
    else alert("Failed to share post: " + data.error);
}

async function renderFriends({
    div,
    sharing = false
} = {}) {
    let friends = await get("accept", null, false, false, true);
    let friendsSkip = 0;
    let currentUsername = await get("username");

    div.querySelector(".user-friends").innerHTML = `<h3>Your friends: </h3>   
        <input type='text' placeholder='Search friends...' class='search-friends-input' />         
        <div class='center'>
            <button id='friends-prev-btn'><i class='fas fa-chevron-left'></i> Prev</button>
            <button id='friends-next-btn'><i class='fas fa-chevron-right'></i> Next</button>
        </div>`;

    div.querySelector(".search-friends-input").addEventListener("input", function () {
        document.querySelectorAll(".friend-card").forEach(card => {
            let text = card.querySelector(".friend-name").textContent.trim().toLowerCase();
            if (text.includes(div.querySelector(".search-friends-input").value.trim().toLowerCase())) card.style.display = "block";
            else card.style.display = "none";
        });
    });

    div.querySelector(".user-friends").querySelector("#friends-prev-btn").addEventListener("click", async function () {
        if (friendsSkip > 0) friendsSkip -= 10;
        friends = await get(`accept?skip=${friendsSkip}`, null, false, false, true);
        renderFriends({
            div: div,
            sharing: sharing
        });
    });

    div.querySelector(".user-friends").querySelector("#friends-next-btn").addEventListener("click", async function () {
        if (div.querySelector(".user-friends").querySelector(".no-post")) return;
        friendsSkip += 10;
        friends = await get(`accept?skip=${friendsSkip}`, null, false, false, true);
        renderFriends({
            div: div,
            sharing: sharing
        });
    });

    checkLength({
        item: friends.content,
        html: 'You don\'t have any friends yet.',
        parent: div,
        appendTo: ".user-friends"
    });

    friends.content.forEach(friend => {
        const inner = document.createElement("div");
        inner.classList.add("card");
        inner.classList.add("friend-card");
        let username = friend.sender === currentUsername.username ? friend.getter : friend.sender;

        inner.innerHTML = `
              <h3 class='friend-name'>${username}</h3>
              <button class='friend-button remove-friend-btn'>Remove Friend</button>
            `;

        if (sharing) inner.addEventListener("click", function () {
            selectedShareFriend = username;
            div.querySelectorAll(".friend-card").forEach(card => card.classList.remove("active-sharing"));
            inner.classList.add("active-sharing");
        });

        inner.querySelector(".remove-friend-btn").addEventListener("click", function () {
            friendAction({
                type: "remove",
                name: friend.sender === currentUsername.username ? friend.getter : friend.sender
            });

            if (!sharing) getProfileData();
            else renderFriends({
                div: div,
                sharing: sharing
            });
        });

        div.querySelector(".user-friends").appendChild(inner);
    });
}

async function viewShareOrigin({
    id
} = {}) {
    if (!id) return alert("It's not you. It's me, Block. Sorry for any errors.");
    let foundPost = await getCustomPost({
        id: id
    });

    if (foundPost.post === null) return alert("Post have been deleted or can no longer been seen.");

    loadPost({
        posts: [foundPost.post],
        isViewMode: true,
        isShareOrigin: true
    })
}

async function loadPost({
    posts,
    isViewMode,
    saver = false,
    isShareOrigin = false
}) {
    let username = await get("username", null, false);
    let postsId = [];
    posts.forEach(post => postsId.push({ id: post?._id }));
    let comments = await getComments(JSON.stringify(postsId));

    posts.forEach(async (post, index) => {
        const div = document.createElement("div");
        const classToAdd = isViewMode ? "post-view" : "post";
        let query = post.anonymous ? "color: green;" : "cursor: pointer; color: red;";
        let emoji = await get(`emoji/other_user/?username=${post.by}`, null, false);
        div.classList.add(classToAdd);
        let commentsSkip = 0;

        div.innerHTML = `
                <div class='center-right'>
                   ${isShareOrigin ? "<i class='fas fa-times close-post-icon'></i>" : ""}
                   ${username && !saver ? "<i class='fas fa-save save-post-icon'></i>" : saver ? "<i class='fas fa-times close-post-icon'></i>" : ""}
                   ${post.share && username ? '<i class="fa-solid fa-clock-rotate-left view-original-icon"></i>' : ""}
                </div>

                <h2 class='title'>${post.title}</h2>
                ${post.image ? `<img style='border: 2px solid #ccc; width: 100%; height: 100%; border-radius: 20px' class='post-image' src='${post.image}'/>` : ""}
                <p>${post.content}</p>

                <span>
                  ${new Date(post.createdAt).toUTCString()} - By 
                  <span style='text-decoration: underline; ${query}'>
                    ${emoji?.emoji && !post.anonymous ? emoji?.emoji : ""} 
                    <span class='by' style='${query}'>${post.anonymous ? post.anonymous_name : post.by}</span>
                    <span class='${post.share ? "share-text" : ""}' style='color: green;'>${post.share ? `</br></br> Forked (Shared) By ${post.sharedBy}: ${post.shareComment}` : ""}</span>
                  </span>
                </span>

                <div class='comment-container'>
                   <div class='comment-list'></div>

                   <div class='center'>
                      <button class='comment-prev-btn'><i class='fas fa-chevron-left'></i></button>
                      <button class='comment-next-btn'><i class='fas fa-chevron-right'></i></button>
                   </div>

                   <div class='input-comment-group'>
                     <input type='text' class='commentInput' placeholder='Enter comment...' />
                      <button class='submitCommentBtn'>Submit</button> 
                   </div>
                </div>
                <div class='options'>
                   <button class='uphorse-btn'>
                     <i class="fas fa-horse-head"></i>
                     <span class='post-uphorse-count'>0</span>
                   </button>

                   <button class='like-btn'>
                     <i class='fas fa-thumbs-up'></i>
                     <span class='post-likes-count'>0</span>
                   </button>
                    <button class='comments-btn'>
                     <i class='fas fa-comment'></i>
                     <span class='post-comments-count'>0</span>
                    </button>
                    <button class='report-btn'>
                     <i class='fas fa-warning'></i>
                     <span class='post-reports-count'>0</span>
                   </button>
                   <button class='download-btn'>
                     <i class='fas fa-download'></i>
                     <span class='post-downloads-count'>0</span>
                   </button>
                   <button class='share-btn'>
                     <i class="fa-solid fa-code-fork"></i>
                   </button>
                   <button class='view-btn'>
                     <i class='fas fa-expand'></i>
                    </button>
                </div>
            `;

        if (isViewMode) div.querySelector(".view-btn").innerHTML = `<i class='fas fa-compress'></i>`;

        div.querySelector(".comment-prev-btn").addEventListener("click", async function () {
            if (commentsSkip > 0) commentsSkip -= 5;
            let comments = await getComments(post._id, commentsSkip);

            renderComments({
                comments: comments || [],
                el: div,
                check: false
            });
        });

        div.querySelector(".comment-next-btn").addEventListener("click", async function () {
            if (!div.querySelector(".comment-list")?.firstElementChild) return;

            commentsSkip += 5;
            let comments = await getComments(post._id, commentsSkip);

            renderComments({
                comments: comments || [],
                el: div,
                check: false
            });
        });

        if (div.querySelector(".view-original-icon")) div.querySelector(".view-original-icon").addEventListener("click", function () {
            viewShareOrigin({
                id: post?.shareId
            });
        });

        if (div.querySelector(".save-post-icon")) div.querySelector(".save-post-icon").addEventListener("click", async function () {
            savePost({
                id: post._id,
                title: post.title
            });
        });

        if (div.querySelector(".close-post-icon")) div.querySelector(".close-post-icon").addEventListener("click", function () {
            div.remove();
        });

        div.querySelector(".share-btn").addEventListener("click", async function () {
            let username = await get("username");
            if (!username) return;

            Swal.fire({
                title: "Share to who?",
                icon: "question",
                html: `
                  <div class='friends-container'><div class='user-friends'></div></div>
                `,
                confirmButtonText: "Submit",
                showCancelButton: true
            }).then(result => {
                if (result.isConfirmed && selectedShareFriend) {
                    Swal.fire({
                        title: "Do you add a quick comment to the post?",
                        icon: "question",
                        input: "text",
                        inputPlaceholder: "Enter your comment here...",
                        confirmButtonText: "Submit",
                        showCancelButton: true,
                        customClass: {
                            input: "edit-input"
                        }
                    }).then(commentResult => {
                        if (commentResult.isConfirmed && commentResult.value) {
                            sharePost({
                                id: post._id,
                                shareTo: selectedShareFriend,
                                comment: commentResult.value
                            });

                            if (!saver) renderPosts();
                        } else {
                            selectedShareFriend = "";
                        }
                    });
                };
            });

            renderFriends({
                div: document.querySelector(".friends-container"),
                sharing: true
            });
        });

        div.querySelector(".by").addEventListener("click", function (e) {
            e.stopPropagation();
            let foundViewPost = document.querySelector(".post-view");

            if (foundViewPost && !foundViewPost.classList.contains("post")) {
                foundViewPost.remove();
            } else if (foundViewPost && foundViewPost.classList.contains("post")) {
                foundViewPost.classList.remove("post-view");
            }

            for (let p of document.querySelectorAll(".post")) {
                if (!post.by) return;
                if (post.anonymous) return;
                const by = p.querySelector(".by").textContent.toLowerCase();

                if (by !== post?.by.toLowerCase()) p.style.display = "none";
                else p.style.display = "block";
            };

            document.querySelector("#viewing-post-from-who").
                innerHTML = `
                      <h2>Viewing post from: ${post?.by}</h2>
                      <button id='undo-view-post'>Undo</button>
                    `;

            if (
                document.querySelector("#undo-view-post")) {
                document.querySelector("#undo-view-post").addEventListener("click", function () {
                    document.querySelectorAll(".post").forEach(p => {
                        p.style.display = "block";
                    });
                    document.querySelector("#viewing-post-from-who").
                        innerHTML = `
                      <h1>Viewing post from: All</h1>
                    `;
                });
            }
        });

        if (saver) div.querySelector(".view-btn").style.display = "none";
        div.querySelector(".view-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            div.classList.toggle("post-view");

            div.querySelector(".view-btn").innerHTML =
                div.classList.contains("post-view") ? "<i class='fas fa-compress'></i>" :
                    "<i class='fas fa-expand'></i>";
        });

        div.querySelector(".uphorse-btn").addEventListener("click", async function (e) {
            e.stopPropagation();
            sendAction({
                type: "uphorse",
                el: div,
                id: post._id
            });
        });

        div.querySelector(".report-btn").addEventListener("click", async function (e) {
            e.stopPropagation();
            sendAction({
                type: "report",
                el: div,
                id: post._id,
            });
        });

        div.querySelector(".like-btn").addEventListener("click", async function (e) {
            e.stopPropagation();
            sendAction({
                type: "like",
                el: div,
                id: post._id
            });
        });

        div.querySelector(".submitCommentBtn").addEventListener("click", async function (e) {
            e.stopPropagation();
            const value = div.querySelector(".commentInput");
            if (!value.value) return alert("Please enter a comment!");

            sendComment({
                el: div,
                id: post._id,
                comment: value.value,
                skip: commentsSkip
            });

            value.value = "";
        });

        div.querySelector(".comments-btn").addEventListener("click", async function (e) {
            e.stopPropagation();
            div.querySelector(".comment-container").classList.toggle("show");
        });

        div.querySelector(".download-btn").addEventListener("click", async function (e) {
            e.stopPropagation();
            downloadPost({
                el: div,
                title: post.title,
                id: post._id,
            });
        });

        if (comments[index]) {
            let postComments = [comments[index]];
            renderComments({ comments: postComments[0], el: div });
        }

        setCountsDisplay({
            el: div,
            likes: post.likes,
            downloads: post.downloads,
            comments: post.commentsCount,
            reports: post.reports,
            uphorses: post.uphorses
        });

        if (isViewMode) {
            document.body.appendChild(div);
        } else {
            document.getElementById("posts-container").appendChild(div);
        }
    });
}

async function requestFriend({
    name
}) {
    const res = await fetch("/friends/request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Friend requested successfully!");
    } else {
        alert("Failed to request friend: " + data.error);
    }
}

async function removeKeyword(keyword) {
    const res = await fetch("/api/remove/keyword", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            keyword: keyword
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Keyword removed!");
    }
    else alert("Failed to remove keyword: " + data.error);
}

async function renameSave({
    saveId,
    cardId,
    newName
}) {
    const res = await fetch("/save/rename/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            saveId: saveId,
            cardId: cardId,
            newName: newName
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Changed!");
        location.reload();
    }
    else alert("Failed to change name: " + data.error);
}

function toggle({ filter, toggle, el, all, renderPosts }) {
    if (all && typeof renderPosts !== "function") return console.error("Render posts is not a function.");

    const removeIfExists = (selector) => {
        const node = document.querySelector(selector);
        if (node) node.remove();
    };

    if (all) {
        document.querySelectorAll(".user-post").forEach(post => post.style.display = "block");
        privatePostsFilter = false;
        anonymousPostsFilter = false;
        el.querySelector(".toggle-anonymous-posts")?.classList.remove("active");
        el.querySelector(".toggle-private-posts")?.classList.remove("active");
        removeIfExists(".no-private");
        removeIfExists(".no-anonymous");
        return renderPosts();
    }

    let foundOne = false;
    const postsContainer = document.querySelector(".user-posts");
    const toggleButton = el?.querySelector(`.toggle-${toggle}-posts`);
    const noToggleSelector = `.no-${toggle}`;
    const noToggleElement = document.querySelector(noToggleSelector);

    removeIfExists(noToggleElement);

    if (toggle === "anonymous") {
        removeIfExists(".no-private");
        privatePostsFilter = false;
        el.querySelector(".toggle-private-posts")?.classList.remove("active");
    }

    if (toggle === "private") {
        removeIfExists(".no-anonymous");
        anonymousPostsFilter = false;
        el.querySelector(".toggle-anonymous-posts")?.classList.remove("active");
    }

    filter = false;
    toggleButton?.classList.remove("active");

    document.querySelectorAll(".user-post").forEach((post) => {
        const node = post.querySelector(`.${toggle}-text`);
        const text = node ? node.textContent.trim().toLowerCase() : "";
        if (text === "yes") {
            post.style.display = "block";
            foundOne = true;
        } else {
            post.style.display = "none";
        }
    });

    if (!foundOne && !noToggleElement && postsContainer) {
        const msg = document.createElement("h3");
        msg.className = `no-${toggle}`;
        msg.style.textAlign = "center";
        msg.textContent = `No ${toggle} posts`;
        postsContainer.appendChild(msg);
    }

    filter = true;
    toggleButton?.classList.add("active");
}
