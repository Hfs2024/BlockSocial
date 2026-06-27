const schemas = require("./schemas.js");

async function checkAuth(req, res, next) {
    try {
        if (!req.session.isLoggedIn) return res.json({
            error: "You are not logged in!"
        });

        const foundUser = await schemas.Users.findById(req.session.userId);
        if (!foundUser) return res.json({ error: "Can't find your account right now!" });
        if (foundUser.banned) return res.json({ error: "Your account is banned for some reason, if you want to appeal, please head to the support now.", banned: true });

        req.currentUser = foundUser;
        next();
    } catch (err) {
        return res.status(500).json({ error: "Error:" + err.message });
    }
}

module.exports = {
    checkAuth
};