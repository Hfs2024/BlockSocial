const content = document.getElementById("content");
const title = document.getElementById("title");
const submitArticle = document.getElementById("submit-article"); 
const articlesContainer = document.querySelector(".articles-container");

async function createArticle({
    content,
    title
} = {}) {
    const res = await fetch("/support/create/article", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: content,
            title: title
        })
    });


    const data = await res.json();
    if (data.success) {
        alert("Article created successfully!");
        location.reload();
    } else {
        alert("Failed to create article: " + data.error);
    }
}

submitArticle.addEventListener("click", function () {
    if (!content.value.trim() || !title.value.trim()) {
        content.classList.add("invalid");
        title.classList.add("invalid");
        setTimeout(() => {
            content.classList.remove("invalid");
            title.classList.remove("invalid");
        }, 1000);
        return;
    }

    createArticle({
        content: content.value.trim(),
        title: title.value.trim()
    });
});
