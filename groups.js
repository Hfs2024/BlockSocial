const { checkAuth } = require("./checkAuth.js");
const schemas = require("./schemas.js");
const express = require("express");
const { update, deleteData } = require("./helpers.js");
const router = express.Router();

async function groupsAction(username, number) {
    await update(schemas.Users, {
        username: username
    }, {
        $inc: {
            joinedGroupsLength: number
        }
    });
}

router.post("/action/:type", checkAuth, async (req, res) => {
    try {
        const { groupName, username } = req.body;
        const type = req.params?.type?.trim();
        if (!groupName || !username || !type) return res.status(400).json({ error: "Missing required fields or action type." });
        if ((type !== "remove") && ((req.currentUser.username !== username))) return res.status(403).json({ error: "Unauthorized action." });

        await schemas.GroupsReq.findOneAndDelete({
            to: username.trim(),
            groupName: groupName
        });

        const actions = {
            remove: async () => {
                let result = await update(schemas.Groups, {
                    name: groupName.trim(), members: {
                        $elemMatch: {
                            name: username.trim(),
                            role: { $ne: "owner" }
                        }
                    }
                }, { $pull: { members: { name: username } }, $inc: { membersCount: -1 } });

                await groupsAction(username, -1);
                if (!result) return res.json({ error: "It seems you are either the owner of this group or not even a member! 😅" });
            },

            accept: async () => {
                if (req.currentUser.joinedGroupsLength >= 50) return res.json({ error: "You are already joined in 50 groups." });

                let result = await update(schemas.Groups, {
                    name: groupName.trim(),
                    membersCount: { $lt: 50 }
                }, {
                    $push: {
                        members: {
                            name: username,
                            role: "member"
                        }
                    },

                    $inc: {
                        membersCount: 1
                    }
                });

                await groupsAction(username, 1);

                if (!result) return res.json({ error: "Group already contains 50 members or group not found." });
            }
        }

        if (actions[type]) await actions[type]();
        else if ((!actions[type]) && (type !== "reject")) return res.json({ error: "Wrong API or action" });

        if (!res.headersSent) return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

async function isGroupOwner(req, res, next) {
    const groupName = req.body.groupName?.trim();
    if (!groupName) return res.json({ error: "Group name required." });

    const isOwner = await schemas.Groups.exists({
        name: groupName,
        members: {
            $elemMatch: {
                name: req.currentUser.username,
                role: "owner"
            }
        }
    });

    if (!isOwner) {
        return res.status(403).json({ error: "Seems you are not the owner of this specific group." });
    }

    next();
}

router.post("/set-admin", checkAuth, isGroupOwner, async (req, res) => {
    try {
        const { username, groupName } = req.body;

        let result = await schemas.Groups.findOneAndUpdate(
            {
                name: groupName,
                "members.name": username.trim()
            },
            {
                $set: {
                    "members.$[ownerEl].role": "owner",
                    "members.$[memberEl].role": "member"
                }
            },
            {
                arrayFilters: [
                    { "ownerEl.name": username },
                    { "memberEl.name": req.currentUser.username }
                ],
                new: true
            }
        );

        if (!result) return res.json({ error: "Group not found" });
        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

router.post("/close-group", checkAuth, isGroupOwner, async (req, res) => {
    try {
        const { groupName } = req.body;
        if (!groupName) return res.json({ error: "Group not found" });
        const foundGroup = await schemas.Groups.findOne({ name: groupName });

        let result = await schemas.Groups.findOneAndDelete({
            name: groupName
        });

        await schemas.GroupsReq.deleteMany({ groupName: groupName });

        if (!result) return res.json({ error: "Group not found" });
        if (foundGroup?.members?.length) { // Not bad because max members is 50.
            await Promise.all(foundGroup.members.map(member =>
                schemas.Users.findOneAndUpdate(
                    { username: member?.name?.trim() },
                    { $inc: { joinedGroupsLength: -1 } }
                )
            ));
        }

        return res.json({ success: true })
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

router.post("/leave-group", checkAuth, async (req, res) => {
    try {
        const { groupName } = req.body;
        if (!groupName) return res.json({ error: "And why not to pass a group name? It does take less than second." });

        let result = await schemas.Groups.findOneAndUpdate({
            name: groupName,
            membersCount: { $ne: 0 },
            members: {
                $elemMatch: {
                    name: req.currentUser.username,
                    role: { $ne: "owner" }
                }
            }
        }, {
            $pull: { members: { name: req.currentUser.username } },
            $inc: {
                membersCount: -1
            }
        }, {
            new: true
        });

        if (!result) return res.json({ error: "Group not found." });
        else await groupsAction(req.currentUser.username, -1);

        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

router.post("/add-user", checkAuth, isGroupOwner, async (req, res) => {
    try {
        const { username, groupName } = req.body;

        let userNotFound = await schemas.Users.findOne({ username: username, banned: false });
        let alreadyMember = await schemas.Groups.findOne({ name: groupName, "members.name": username });
        let alreadyReq = await schemas.GroupsReq.findOne({ to: username, from: req.currentUser.username, groupName: groupName });
        if (!userNotFound) return res.json({ error: "Can't find this account right now." });
        if (alreadyMember) return res.json({ error: "Already a member" });
        if (alreadyReq) return res.json({ error: "Already requested" });

        let newItem = new schemas.GroupsReq({
            from: req.currentUser.username,
            to: username,
            groupName: groupName
        });

        await newItem.save();
        return res.json({
            success: true
        });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

router.post("/create", checkAuth, async (req, res) => {
    try {
        let { groupName, groupDesc } = req.body;
        if (!groupName || !groupDesc) return res.json({ error: "You didn't enter required field! " });
        groupName = groupName.trim();
        groupDesc = groupDesc.trim();

        let found = await schemas.Groups.findOne({ name: groupName });
        if (found) return res.json({ error: "A group already exist with this name!" });

        if (groupName.length > 30 || groupName.length < 3) return res.json({
            error: "Group name length must be less than or equal to 30 and greater than or equal to 3."
        });

        if (groupDesc.length > 100 || groupDesc.length < 30) return res.json({
            error: "Group description length must be less than or equal to 100 and greater than or equal to 30"
        });

        let newGroup = new schemas.Groups({
            name: groupName,
            desc: groupDesc,
            members: [{
                name: req.currentUser.username,
                role: "owner"
            }],
            membersCount: 1
        });

        await newGroup.save();

        await schemas.Users.findOneAndUpdate({ username: req.currentUser.username }, {
            $inc: {
                joinedGroupsLength: 1
            }
        }, {
            new: true
        });

        return res.json({
            success: true
        });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

module.exports = {
    router
};