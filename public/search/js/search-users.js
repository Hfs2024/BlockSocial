const container = document.getElementById("users-container");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
let skip = 0;

clearBtn.addEventListener("click", function () {
    if (document.querySelector("#no-user-found")) {
        document.querySelector("#no-user-found").remove();
    }

    document.querySelectorAll(".post").forEach(post => {
        post.style.display = "block";
    });

    searchInput.value = "";
});

searchBtn.addEventListener("click", function () {
    const value = searchInput.value.toLowerCase();
    let foundOne = false;
    if (document.querySelector("#no-user-found")) {
        document.querySelector("#no-user-found").remove();
    }

    document.querySelectorAll(".post").forEach(post => {
        const title = post.querySelector(".title").textContent.toLowerCase();
        if (title.includes(value)) {
            post.style.display = "block";
            foundOne = true;
        } else {
            post.style.display = "none";
        }
    });

    if (!foundOne) {
        const h2 = document.createElement("h2");
        h2.textContent = "No user found.";
        h2.id = "no-user-found";
        h2.style.textAlign = "center";
        h2.classList.add("post");
        container.appendChild(h2);
    }
});

prevBtn.addEventListener("click", () => {
    if (skip > 0) skip -= 50;
    fetchUsers();
});

nextBtn.addEventListener("click", () => {
    skip += 50;
    fetchUsers();
});

async function fetchUsers() {
    const res = await fetch(`/get/allUsers/?skip=${skip}`);
    const data = await res.json();

    container.innerHTML = "";
    if (!data.content.length || data.content.length <= 0) {
        const h2 = document.createElement("h2");
        h2.classList.add("post");
        h2.style.textAlign = "center";
        h2.innerHTML = "No users yet! Be the first one to signup <a href='/signup'>here</a>!";
        container.appendChild(h2);
    }

    if (data.success) {
        data.content.forEach(user => {
            const div = document.createElement("div");
            div.classList.add("post");
            div.innerHTML = `
              <h1 class='title'>${user?.emoji} ${user?.username}</h1>
              <p><q>${user?.bio || "No bio found."}</q></p>
              <p><b>Account created at:</b> </br> ${new Date(user?.createdAt).toDateString()}</p>
              <div class='center'>
                 <button id='report-btn' style='width: 100%;'>Report user</button>
              </div>
            `;
            container.appendChild(div);

            div.querySelector("#report-btn").addEventListener("click", async function () {
                Swal.fire({
                    icon: "warning",
                    input: "text",
                    text: "Reason for reporting this user:",
                    inputPlaceholder: "Enter the reason here...",
                    showCancelButton: true,
                    confirmButtonText: "Submit",
                    customClass: {
                        input: "edit-input"
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const res = await fetch("/report/user", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                username: user.username,
                                reason: result.value
                            })
                        });

                        const data = await res.json();
                        if (data.success) {
                            alert(`Reported successfully!`);
                            location.reload();
                        } else {
                            alert("Failed to report this user: " + data.error);
                        }
                    }
                });
            });
        });
    } else {
        return alert("Failed to get data: " + data.error);
    }
}

fetchUsers();