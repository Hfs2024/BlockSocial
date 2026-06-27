const express = require("express");
const path = require("path");
const schemas = require("./schemas.js");
const { checkAuth } = require("./checkAuth.js");
const { deleteData, update } = require("./helpers.js");
const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/support/index.html"));
});

router.get("/create", (req, res) => {
    if (req.session.isAdmin) {
        return res.sendFile(path.join(__dirname, "/public/support/create.html"));
    } else {
        return res.redirect("/private/admin/login/");
    }
});

router.post("/delete/article", async (req, res) => {
    try {
        const { id } = req.body;
        if (!req.session.isAdmin) return res.json({
            error: "Only admins can delete articles!"
        });

        let result = await deleteData(schemas.SupportArticles, {
            _id: id
        });

        if (!result) return res.json({
            error: "Article not found!"
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
})

router.post("/update/article", async (req, res) => {
    try {
        const { id, newContent } = req.body;
        if (!req.session.isAdmin) return res.json({
            error: "Only admins can update articles!"
        });

        let result = await update(schemas.SupportArticles, {
            _id: id
        },
            {
                $set: {
                    content: newContent
                }
            });

        if (!result) return res.json({
            error: "Article not found!"
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
})

router.get("/get", async (req, res) => {
    try {
        const skip = parseInt(req.query.skip);
        if (!Number.isInteger(skip)) return res.json({ error: "I am not happy now 😣. Skip must be an integer." });
        const articles = await schemas.SupportArticles.find({}).skip(skip).limit(10);

        return res.json({
            success: true,
            articles: articles
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

router.post("/create/article", async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!req.session.isAdmin) return res.json({
            error: "Only admins can create articles!"
        });
        const date = new Date().toDateString();

        if (!title || !content) return res.json({
            error: "You didn't enter a title or content"
        });

        const article = new schemas.SupportArticles({
            title: title,
            content: content,
            createdAt: date,
            likes: 0,
            dislikes: 0
        });

        await article.save();
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

router.post("/reaction", checkAuth, async (req, res) => {
    const { type, id } = req.body;
    let result = await update(schemas.SupportArticles, {
        _id: id,
        "reactionsBy.name": {
            $ne: req.currentUser.username
        },
        "reactionsBy.reactionType": {
            $ne: type
        }
    },
        {
            $inc: {
                likes: type === "like" ? 1 : 0,
                dislikes: type === "dislike" ? 1 : 0
            },
            $push: {
                reactionsBy: {
                    name: req.currentUser.username,
                    at: new Date().toDateString(),
                    reactionType: type
                }
            }
        });

    if (!result) return res.json({
        error: "Article not found or you have already reacted!"
    });

    return res.json({
        success: true
    });
});

module.exports = {
    router
};