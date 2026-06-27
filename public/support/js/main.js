const articlesContainer = document.querySelector(".articles-container");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

searchBtn.addEventListener("click", function () {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".article").forEach(article => {
        const title = article.querySelector(".title").textContent.toLowerCase();
        const content = article.querySelector(".content").textContent.toLowerCase();
        if (title.includes(query) || content.includes(query)) {
            article.style.display = "block";
        } else {
            article.style.display = "none";
        }
    });
});

async function react({
    type,
    id
} = {}) {
    const res = await fetch("/support/reaction", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type: type,
            id: id
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Thanks for your feedback!");
    } else {
        alert("An error occured: " + data.error);
    }
}
