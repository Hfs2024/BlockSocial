const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const username = document.getElementById("username");
const search = document.getElementById("search");
const currentCount = document.getElementById("current-count");
const reportsContainer = document.getElementById("report-container");
let skip = 0;

nextBtn.addEventListener("click", function () {
    if (reportsContainer.querySelector(".no-found")) return;
    if (!username.value) return alert("Please enter a username!");

    skip += 10;
    loadReports(username.value);
});

prevBtn.addEventListener("click", function () {
    if (!username.value) return alert("Please enter a username!");

    if (skip > 0) skip -= 10;
    loadReports(username.value);
});

search.addEventListener("click", function () {
    if (!username.value) return alert("Please enter a username!");

    loadReports(username.value);
});

async function adminAction({ item, username, messages, api }) {
    if (!Array.isArray(messages)) return console.log(`Ouch ❕❕ Messages type is: ${typeof messages}`);
    if ((item === undefined || item === null) || (!username || !api)) return console.log("😣😣 Missing the required fields again.");

    let check = window.confirm("Are you 100% sure about this?");
    if (!check) return;

    const res = await fetch(`/private/action/${api}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            value: item ? false : true
        })
    });

    const action = await res.json();
    console.log(action);
    if (action.success) Swal.fire({
        title: `${action[api] ? messages[0] : messages[1] }`,
        icon: "success"
    });
    else Swal.fire({
        title: action.error,
        icon: "error"
    });

    loadReports(username);
}

async function loadReports(username) {
    const res = await fetch("/private/get/reports", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            skip: skip
        })
    });

    const data = await res.json();
    if (data.error) {
        alert(data.error);
        return;
    }

    reportsContainer.innerHTML = "";
    currentCount.textContent = `Viewing ${skip}-${skip + 10}`;

    if (!data.reports || data?.reports?.length <= 0) {
        reportsContainer.innerHTML = `
          <div class='item no-found'>
            <p>No reports found.</p>
          </div>
        `;
        return;
    }

    data.reports.forEach(report => {
        const div = document.createElement("div");
        div.classList.add("item");
        div.style.borderRadius = "10px";

        div.innerHTML = `
           <p class='username'>${report.reporter}</p>
           <p>${report.reason}</p>
           <p>Reported user email: <a href="mailto:${report.email}">${report.email}</a></p>
           <div class='group-overflow'>
              <button class='ban-user'><i class='fas fa-ban'></i> ${data.isBanned ? "Unban" : "Ban"} User (${report.username})</button>
              <button class='report-user'><i class='fas fa-warning'></i> ${data.isReported ? "Undo the report" : "Report"} User (${report.username})</button>
           </div>
        `;

        div.querySelector(".ban-user").addEventListener("click", async function () {
            adminAction({
                item: data.isBanned,
                messages: ["Banned!", "Unbanned!"],
                username: report.username,
                api: "ban"
            });
        });

        div.querySelector(".report-user").addEventListener("click", async function () {
            adminAction({
                item: data.isReported,
                messages: ["Reported!", "Report removed!"],
                username: report.username,
                api: "report"
            });
        });

        reportsContainer.appendChild(div);
    });
}

