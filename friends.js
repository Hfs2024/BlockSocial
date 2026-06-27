const express = require("express");
const schemas = require("./schemas.js");
const { checkAuth } = require("./checkAuth.js");
const { update, deleteData } = require("./helpers.js");
const router = express.Router();

router.get("/api/get/accept", checkAuth, async (req, res) => {
    try {
        const skip = parseInt(req.query.skip);
        const foundUser = req.currentUser;

        let found = await schemas.Friends.find({
            $or: [
                {
                    getter: foundUser.username,
                    type: "accepted"
                },
                {
                    sender: foundUser.username,
                    type: "accepted"
                }
            ]
        }).skip(skip || 0).limit(10).lean();

        return res.json({
            success: true,
            content: found
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

router.post("/action/:type", checkAuth, async (req, res) => {
    try {
        const { name } = req.body;
        const foundUser = req.currentUser;
        const type = req.params.type;
        let result = null;

        const removeRejectLogic = async () => {
            result = await deleteData(schemas.Friends, {
                $or: [
                    {
                        sender: name,
                        getter: foundUser.username
                    },
                    {
                        getter: name,
                        sender: foundUser.username
                    }
                ]
            });
        }

        const actions = {
            accept: async () => {
                let foundFriend = await schemas.Users.findOne({ username: name, banned: false });
                if (!foundFriend) return;

                result = await update(schemas.Friends, {
                    sender: name,
                    getter: foundUser.username
                }, {
                    type: "accepted"
                });
            }
        }

        if (["remove", "reject"].includes(type)) await removeRejectLogic();
        else if (actions[type]) await actions[type]();
        else return console.log("Wrong API or action.");

        if (!result) return res.json({
            error: "User not found!"
        });

        return res.json({
            success: true
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

router.get("/api/get/request", checkAuth, async (req, res) => {
    try {
        let foundFriends = await schemas.Friends.find({
            getter: req.currentUser.username,
            type: "pending"
        }).skip(parseInt(req.query.skip) || 0).limit(10).lean();

        return res.json({
            success: true,
            request: foundFriends
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

router.post("/request", checkAuth, async (req, res) => {
    try {
        const { name } = req.body;
        const foundUser = req.currentUser;
        if (name === foundUser.username) return res.status(400).json({ error: "You can't request yourself as a friend!" });

        const [foundFriend, alreadyFriend] = await Promise.all([
            schemas.Users.findOne({ username: name, banned: false }).lean(),
            schemas.Friends.findOne({
                type: { $in: ["accepted", "pending"] },
                $or: [
                    { sender: name, getter: foundUser.username },
                    { sender: foundUser.username, getter: name }
                ]
            }).lean()
        ]);

        if (!foundFriend) return res.status(404).json({ error: "User not found!" });
        if (alreadyFriend) return res.status(400).json({ error: "You are already friends or have a pending request!" });

        const newFriend = new schemas.Friends({
            sender: foundUser.username,
            getter: foundFriend.username,
            addedAt: new Date().toString(),
            type: "pending"
        });

        await newFriend.save();
        return res.status(201).json({ success: true });
    } catch (e) {
        console.error("Friend Request Error:", e);
        return res.status(500).json({ error: "Server Error" });
    }
});


module.exports = {
    router
};