const express = require("express");
const schemas = require("./schemas.js");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");
const { checkAuth } = require("./checkAuth.js");
const { update } = require("./helpers.js");
const router = express.Router();

router.post("/update/post", checkAuth, async (req, res) => {
    try {
        const { id, newContent } = req.body;

        let result = await update(schemas.Posts, {
            _id: id,
            by: req.currentUser.username
        }, {
            $set: {
                content: newContent
            }
        });

        if (!result) return res.json({
            error: "Post not found!"
        });

        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

router.post("/delete/post", checkAuth, async (req, res) => {
    const { id } = req.body;

    try {
        const foundPost = await schemas.Posts.findOne({
            $or: [
                { _id: id, by: req.currentUser.username, share: false },
                { _id: id, sharedBy: req.currentUser.username, share: true }
            ]
        });
        if (!foundPost) return res.json({
            error: "Post not found!"
        });

        if (foundPost.image && fs.existsSync(foundPost.image)) {
            fs.unlink(foundPost.image, (err) => {
                if (err) console.log("Error: " + err);
            });
        }

        await schemas.Reactions.deleteMany({
            id: foundPost._id, itemModel: "Posts"
        });

        await schemas.Comments.deleteMany({
            for: foundPost._id
        });

        await schemas.Images.findOneAndDelete({
            path: foundPost.image,
            by: req.currentUser.username
        });

        await schemas.Posts.findByIdAndDelete(id);
        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

module.exports = {
    router
};