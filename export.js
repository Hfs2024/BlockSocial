const express = require("express");
const schemas = require("./schemas");
const { checkAuth } = require("./checkAuth.js");
const router = express.Router();

router.post("/posts", checkAuth, async (req, res) => {
    try {
        const { count } = req.body;
        if (!Number.isInteger(count)) return res.json({ error: "MUST BE A NUMBER OR GOODBYE" });

        if (count > 300 || count < 15) return res.json({
            error: "Count should be less than 300 and bigger than 15"
        });

        let posts = await schemas.Posts.find({
            by: req.currentUser.username
        })
            .limit(count)
            .select('title content keywords group createdAt')
            .sort({ createdAt: -1 })
            .lean()

        return res.json({
            success: true,
            posts: posts
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

module.exports = {
    router
};