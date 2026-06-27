const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
let skip = 0;

prevBtn.addEventListener("click", function () {
    if (skip > 0) skip -= 10;
    getArticles();
});

nextBtn.addEventListener("click", function () {
    if (articlesContainer.querySelector(".no-found")) return;
    skip += 10;
    getArticles();
});

function decodeHTMLEntities(content) {
    const parser = new DOMParser();
    let el = parser.parseFromString(content, "text/html");
    return el.documentElement.textContent;
}

async function getArticles({
    update
} = {}) {
    const res = await fetch(`/support/get/?skip=${skip}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    if (data.success) {
        articlesContainer.innerHTML = "";
        if (data.articles.length <= 0) {
            articlesContainer.innerHTML = "<p style='text-align: center;' class='no-found'>No articles found!</p>";
            return;
        }

        data.articles.forEach(article => {
            const div = document.createElement("div");
            div.classList.add("article");
            div.innerHTML = `
        <h2 class='title'>${article.title}</h2>
        <div class='content'></div>
        <div class="article-footer">
            <span style='color: red;'>Created at:</br> ${article.createdAt}</span>
        </div></br>

        ${update ?
                    `
              <div class='input-group'>
                 <button style='width: 100%' class='update-btn other-btn'>Update</button>
                 <button style='width: 100%' class='delete-btn other-btn'>
                    Delete
                 </button>
                 <button class='view'>
                     <i class='fas fa-expand view-btn'></i>
                 </button>
             </div>
            ` :
                    `<div class='input-group'>
            <button>
               <i class='fas fa-thumbs-up like-btn'></i>
            </button>

            <button
               <i class='fas fa-thumbs-down dislike-btn'></i>
            </button>

            <button class='view'>
               <i class='fas fa-expand view-btn'></i>
            </button>
        </div></br>

         <div class='input-group'>
            <button class='other-btn'>Likes: ${article.likes}</button>
            <button class='other-btn'>Dislikes: ${article.dislikes}</button>
         </div>`
                }
        `;
            let checkStatus = () => {
                if (div.classList.contains("view-mode")) {
                    div.querySelector(".view-btn").classList.replace("fa-expand", "fa-compress");
                    div.querySelector(".content").innerHTML = decodeHTMLEntities(article.content);
                } else {
                    div.querySelector(".view-btn").classList.replace("fa-compress", "fa-expand");
                    div.querySelector(".content").innerHTML = `${decodeHTMLEntities(article.content.slice(0, 100))}...`;
                }
            }

            div.querySelector(".content").innerHTML = `${decodeHTMLEntities(article.content.slice(0, 100))}...`;

            if (div.querySelector(".delete-btn")) div.querySelector(".delete-btn").addEventListener("click", async function () {
                let check = window.confirm("Are you really sure about that?");
                if (!check) return;

                const res = await fetch("/support/delete/article", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: article._id
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert("Article deleted successfully!");
                    getArticles({
                        update: true
                    });
                } else {
                    alert("Failed to delete article: " + data.error);
                }
            });

            if (div.querySelector(".update-btn")) div.querySelector(".update-btn").addEventListener("click", function () {
                Swal.fire({
                    title: 'What new content do you want?',
                    input: 'text',
                    inputPlaceholder: 'Enter your content...',
                    showCancelButton: true
                }).then(async (result) => {
                    if (result.value) {
                        const res = await fetch("/support/update/article", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: article._id,
                                newContent: result.value
                            })
                        });

                        const data = await res.json();
                        if (data.success) {
                            alert("Article updated successfully!");
                            getArticles({
                                update: true
                            });
                        } else {
                            alert("Failed to update article: " + data.error);
                        }
                    }
                });
            });

            if (div.querySelector(".like-btn")) div.querySelector(".like-btn").addEventListener("click", async function () {
                react({
                    type: "like",
                    id: article._id
                });
            });

            if (div.querySelector(".dislike-btn")) div.querySelector(".dislike-btn").addEventListener("click", async function () {
                react({
                    type: "dislike",
                    id: article._id
                });
            });

            if (div.querySelector(".view")) div.querySelector(".view").addEventListener("click", function () {
                div.classList.toggle("view-mode");
                checkStatus();
            });
            articlesContainer.appendChild(div);
        });
    } else {
        alert("Failed to load articles: " + data.error);
    }
}
