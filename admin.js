const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const e = require("express");
const schemas = require("./schemas.js");
const { update } = require("./helpers.js");
const router = express.Router();

const isAdmin = (req, res, next) => {
    if (!req.session.isAdmin) return res.json({ error: "You are not an admin." });
    next();
}

router.get("/", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect("/private/admin/login/?banPanel=true");
    return res.sendFile(
        path.join(__dirname, "private/ban-panel.html")
    )
});

router.post("/action/:action", isAdmin, async (req, res) => {
    try {
        const { username, value } = req.body;
        const action = req?.params?.action?.trim();
        if (!username) return res.json({ error: "And required fields? Why are they missing? 😡" });
        if (!action) return res.json({ error: "Oh, no action? You want to sit and watch an action movie?? Go bring that action now. 🎥🍿" });
        if (typeof value !== "boolean") return res.json({ error: "😮 Not a boolean???" });

        let query = { banned: value };
        if (action === "report") query = { reported: value };

        let result = await schemas.Users.findOneAndUpdate({
            username: username
        }, {
            $set: query
        }, {
            new: true
        });

        if (!result) return res.json({ error: "User not found" });
        return res.json({
            success: true,
            report: result.reported,
            ban: result.banned
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
})

router.post("/get/reports", isAdmin, async (req, res) => {
    try {
        const { username, skip } = req.body;
        if (!Number.isInteger(skip)) return res.json({ error: "Not an number?" });
        if (!username) return res.json({ error: "And required fields? Why are they missing? 😡" });

        let user = await schemas.Users.findOne({ username: username });
        if (!user) return res.json({ error: "User not found." });
        let found = await schemas.Reports.find({ username: username }).skip(skip).limit(10);

        return res.json({
            success: true,
            reports: found,
            isBanned: user.banned,
            isReported: user.reported
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

router.get("/admin/login", async (req, res) => {
    if (req.session.isAdmin) return res.redirect("/private/");

    return res.sendFile(
        path.join(__dirname, "private/admin-login.html")
    );
});

router.post("/admin/login", async (req, res) => {
    const banPanel = req.query.banPanel === "null" ? false : true;
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME) {
        const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
        if (isValidPassword) {
            req.session.isAdmin = true;
            return res.json({ success: true, url: banPanel ? "/private/" : "/support/create" });
        } else {
            return res.json({
                error: "Invalid credentials"
            });
        }
    } else {
        res.json({ error: "Invalid credentials" });
    }
});

module.exports = {
    router
}