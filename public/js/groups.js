const container = document.querySelector(".groups-hall-container");
const reqContainer = document.querySelector(".groups-request-container");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const prevReqBtn = document.querySelector(".prev-req-btn");
const nextReqBtn = document.querySelector(".next-req-btn");
const taskBarBtn = document.querySelectorAll(".taskbar-btn");
const taskBarPanel = document.querySelectorAll(".taskbar-panel-no-style");
const createGroupName = document.getElementById("create-group-name");
const createGroupDesc = document.getElementById("create-group-desc");
const createGroupBtn = document.getElementById("create-group-btn");
let skip = 0;
let reqSkip = 0;

taskBarBtn.forEach((btn, index) => {
    btn.addEventListener("click", function () {
        taskBarPanel.forEach(panel => panel.style.display = "none");
        taskBarBtn.forEach(btn => btn.classList.remove("selected"));

        taskBarPanel[index].style.display = "block";
        btn.classList.add("selected");
    });
});

prevBtn.addEventListener("click", () => {
    if (skip > 0) skip -= 10;
    renderGroups();
});

nextBtn.addEventListener("click", () => {
    if (!container.querySelector(".no-post")) skip += 10;
    renderGroups();
});

prevReqBtn.addEventListener("click", function () {
    if (reqSkip > 0) reqSkip -= 10;
    renderGroupsRequests();
});

nextReqBtn.addEventListener("click", () => {
    if (!reqContainer.querySelector(".no-post")) reqSkip += 10;
    renderGroupsRequests();
});

async function groupAction({
    username = null, groupName = null, item = "do this action", message = "Action done", api
}) {
    if (!api) return console.log("You didn't pass an API.");

    const res = await fetch(api, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            groupName: groupName
        })
    });

    const data = await res.json();
    if (data.success) alert(message);
    else alert(`Failed to ${item}: ` + data.error);

    location.reload();
}

async function renderGroupsRequests() {
    const requests = await get(`groupsReq/?skip=${reqSkip}`);
    reqContainer.innerHTML = "";

    checkLength({
        item: requests.content,
        html: "You don't have any groups requests yet.",
        appendTo: ".groups-request-container",
    });

    requests.content.forEach(req => {
        const div = document.createElement("div");
        div.classList.add("card");
        div.innerHTML = `
          <p style='text-align: left; font-size: 23px; font-weight: bold;'>${req.groupName.slice(0, 1).toUpperCase() + req.groupName.split("").slice(1).join("")}</p>
          <span class='red'>${req.from}</span> sends you a request to join <span class='red'>${req.groupName}</span>
          <div class='center'>
              <button class='accept-group-btn'>Join</button>
              <button class='cancel-group-btn'>Cancel</button>
          </div>
        `;

        div.querySelector(".accept-group-btn").addEventListener("click", function () {
            groupAction({
                api: "/groups/action/accept",
                username: req.to,
                groupName: req.groupName,
                item: "accept",
                message: "Accepted!"
            });
        });

        div.querySelector(".cancel-group-btn").addEventListener("click", function () {
            groupAction({
                api: "/groups/action/reject",
                username: req.to,
                groupName: req.groupName,
                item: "reject",
                message: "Rejected!"
            });
        });

        reqContainer.appendChild(div);
    });
}

async function renderGroups() {
    const groups = await get(`groups/?skip=${skip}`);
    container.innerHTML = "";

    checkLength({
        item: groups.content,
        html: "You don't have any groups yet.",
        appendTo: ".groups-hall-container",
    });

    groups.content.forEach(async group => {
        const div = document.createElement("div");
        let username = await get("username");
        group.members.sort((a, b) => (b.role === "owner") - (a.role === "owner"));
        let isOwner = group.members.find(member => (member.name === username.username) && (member.role === "owner"));

        div.classList.add("card");
        div.innerHTML = `
          <p style='font-size: 20px;'><b>${group.name}</b></p>
          <p class='group-desc'><q>${group.desc || "No description provided."}</q></p>
          <p style='text-align: left; font-weight: bold;'>Members: </p>
          <ul class='group-members-list'></ul>

          <div class='group-buttons-panel'>
             <button class='group-sign-out' style='color: red;'><i class="fas fa-sign-out-alt"></i> Leave</button>
             ${isOwner ? `
                <button class='group-add-user' style='color: blue;'><i class="fas fa-user-plus"></i> Add Users</button>
                <button class='group-close-btn' style='color: orange;'><i class='fas fa-times-circle'></i> Close Group</button>
            ` : ""}
             <button class='group-help' style='color: green;'><i class="fas fa-question-circle"></i> Help</button>
          </div>
        `;

        if (div.querySelector(".group-sign-out")) div.querySelector(".group-sign-out").addEventListener("click", function () {
            Swal.fire({
                title: "Are you really sure? This action cannot be undone without the owner's permission.",
                showCancelButton: true
            }).then(result => {
                if (result.isConfirmed) groupAction({
                    api: "/groups/leave-group",
                    groupName: group.name,
                    item: "leave group",
                    message: "Group left!"
                });
            });
        });

        if (div.querySelector(".group-close-btn")) div.querySelector(".group-close-btn").addEventListener("click", function () {
            Swal.fire({
                title: "Are you 100% sure about this?",
                showCancelButton: true
            }).then(result => {
                if (result.isConfirmed) groupAction({
                    api: "/groups/close-group",
                    groupName: group.name,
                    item: "close group",
                    message: "Group deleted!"
                });
            })
        });

        if (div.querySelector(".group-add-user")) div.querySelector(".group-add-user").addEventListener("click", function () {
            Swal.fire({
                title: "Who to add?",
                input: "text",
                inputPlaceholder: "Enter username...",
                showCancelButton: true,
                customClass: {
                    input: "edit-input"
                }
            }).then(async result => {
                if (result.value) {
                    groupAction({
                        api: "/groups/add-user",
                        username: result.value,
                        groupName: group.name,
                        item: "request",
                        message: "User requested!"
                    });
                }
            });
        });

        div.querySelector(".group-help").addEventListener("click", function () {
            Swal.fire({
                title: "What is this?",
                html: `
    <ul style="text-align: left; padding-left: 20px; line-height: 1.6;">
      <li><strong>Group Feature:</strong> This feature allows you to group users together seamlessly.</li>
      <li><strong>Privacy Rule:</strong> No one else will ever know about your group to maintain absolute privacy. Only people you invite.</li>
      <li><strong>Invitation Rule:</strong> Only the group owner can invite new members to the group.</li>
      <li><strong>User Roles:</strong> Owner is displayed in <span style="color: orange; font-weight: bold;">orange</span>, while other group users are listed in <span style='font-weight: bold;'>black</span> directly below the owner.</li>
      <li><strong>Posting Rule:</strong> To create a group post, go to the normal post page and simply select your group from the dropdown menu.</li>
    </ul>
  `,
                icon: "info"
            });
        });

        group.members.forEach(member => {
            const li = document.createElement("li");
            li.innerHTML = `${member.name} - ${member.role} ${(member.name !== username.username) && isOwner ? `
                <div class='group-buttons'>
                  <i class='fas fa-trash remove-group-user-btn'></i>
                  <i class='fa-solid fa-user-tie set-owner-group-btn'></i>  
                </button>
            ` : ""}`;
            li.classList.add("group-li");
            li.style.color = member.role === "owner" ? "orange" : "black";
            if (li.querySelector(".set-owner-group-btn")) li.querySelector(".set-owner-group-btn").addEventListener("click", function () {
                Swal.fire({
                    title: "Dude, are you sure? You won't be an admin anymore.",
                    showCancelButton: true
                }).then(result => {
                    if (result.isConfirmed) groupAction({
                        api: "/groups/set-admin",
                        item: "set this user as admin",
                        username: member.name,
                        groupName: group.name,
                        message: "Done! They are the new admin."
                    });
                });
            });

            if (li.querySelector(".remove-group-user-btn")) li.querySelector(".remove-group-user-btn").addEventListener("click", function () {
                groupAction({
                    username: member.name,
                    groupName: group.name,
                    api: "/groups/action/remove",
                    item: "remove user",
                    message: "Removed!"
                })
            });

            div.querySelector(".group-members-list").appendChild(li);
        });

        container.appendChild(div);
    });
}

createGroupBtn.addEventListener("click", async function () {
    const res = await fetch("/groups/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            groupName: createGroupName.value,
            groupDesc: createGroupDesc.value
        })
    });

    const data = await res.json();
    if (data.success) {
        alert("Group created!");
        renderGroups();
    } else {
        alert("Failed to create group: " + data.error);
    }

    createGroupDesc.value = "";
    createGroupName.value = "";
});

renderGroups();
renderGroupsRequests();