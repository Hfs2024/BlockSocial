const express = require("express");
const schemas = require("./schemas.js");
const { checkAuth } = require("./checkAuth.js");
const router = express.Router();

router.post("/user", checkAuth, async (req, res) => {
    try {
        const { reason, username } = req.body;
        if (username === req.currentUser.username) return res.json({ error: "Why report yourself? If you made a wrong post, you can simply delete or edit it from your profile."});
        if (!reason || reason.length < 20 || reason.length > 50) return res.json({ error: "Reason length should be between 20~50 characters long." });

        let result = await schemas.Users.findOneAndUpdate(
            { username: username, banned: false },
            {
                $set: { reported: true }
            }
        );

        if (!result) return res.json({
            error: "User not found!"
        });

        let newReport = new schemas.Reports({
            userId: result._id,
            reporter: req.currentUser.username,
            reason: reason,
            username: username,
            email: result.email
        });

        await newReport.save();
        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({ error: "Server Error" });
    }
});

module.exports = {
    router
};