const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const crypto = require("crypto");
const schemas = require("./schemas.js");
const { checkAuth } = require("./checkAuth.js");
const { update, generateCodes } = require("./helpers.js");
const router = express.Router();

router.get("/password", async (req, res) => {
    return res.sendFile(path.join(__dirname, "public/forgot/password.html"));
});

router.post("/reset", async (req, res) => {
    try {
        const { username, code, newPass } = req.body;
        if (!username || !code || !newPass) return res.json({ error: "Please fill in all fields!" });
        if (newPass.length < 6) return res.json({ error: "Password must be 6 chars at least" });
        let foundOne = false;
        let foundUser = await schemas.Users.findOne({ username: username });
        if (!foundUser) return res.json({ error: "User not found" });

        for (let recoveryCode of foundUser.recovery_codes) {
            const isMatch = await bcrypt.compare(code, recoveryCode.code);
            if (!isMatch) continue;

            foundOne = true;
            await update(schemas.Users, {
                username: username
            }, {
                password: await bcrypt.hash(newPass, 10)
            });
            break;
        };

        if (!foundOne) return res.json({ error: "Invalid recovery code" });
        else return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "An error occurred while resetting your password. Please try again later." });
    }
});

router.post("/revoke", checkAuth, async (req, res) => {
    try {
        const { id } = req.body;
        let fullCodes = [];

        for (let i = 0; i < 10; i++) {
            const code = generateCodes();

            fullCodes.push({
                code: await bcrypt.hash(code, 10)
            });
        }

        update(schemas.Users, {
            username: req.currentUser.username
        }, {
            recovery_codes: fullCodes
        });

        return res.json({
            success: true,
            codes: fullCodes.map(code => code.code)
        })
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "An error occurred while resetting your codes. Please try again later." });
    }
});

module.exports = {
    router
};