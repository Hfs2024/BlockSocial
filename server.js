require("dotenv").config({
    quiet: true
});
const { checkAuth } = require("./checkAuth.js");
const express = require('express');
const path = require("path");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const schemas = require("./schemas.js");
const multer = require("./multer.js");
const actions = require("./actions.js");
const report = require("./report-user.js");
const search = require("./search.js");
const support = require("./support.js");
const export_file = require("./export.js");
const save = require("./save.js");
const forgotPassword = require("./forgot-password.js");
const admin = require("./admin.js");
const friends = require("./friends.js");
const groups = require("./groups.js");
const he = require("he");
const crypto = require('crypto');
const fs = require("fs");
const upload = require("./upload.js");
const mongoose = require("mongoose");
const { update, deleteData, pullGroupMember } = require("./helpers.js");
const app = express();
app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.use(express.static(path.join(__dirname, "private"), { index: false }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 3600000,
        SameSite: 'Lax'
    }
}));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: {
        error: "Too many requests from this IP, please try again after a while."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Multer
app.use("/multer", multer.router);

// JSON
app.use(express.json({ limit: "10mb" }));

// Purify
function cleanData(data) {
    if (typeof data === 'string') {
        return he.encode(data).trim();
    }

    if (Array.isArray(data)) {
        return data.map(item => cleanData(item));
    }

    if (data !== null && typeof data === 'object') {
        const cleanedObject = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                cleanedObject[key] = cleanData(data[key]);
            }
        }
        return cleanedObject;
    }

    return data;
}

async function purifyAll(req, res, next) {
    if (req.body) req.body = cleanData(req.body);
    if (req.query) req.query = cleanData(req.query);
    if (req.params) req.params = cleanData(req.params);

    next();
}

app.use(purifyAll);
app.use("/groups", groups.router);
app.use("/save", save.router);
app.use("/private", admin.router)
app.use("/export", export_file.router);
app.use("/support", support.router);
app.use("/search", search.router);
app.use("/report", report.router);
app.use("/actions", actions.router);
app.use("/forgot", forgotPassword.router);
app.use("/upload", upload.router);
app.use("/friends", friends.router);

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/hall/:item", async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/login");
    return res.sendFile(path.join(__dirname, `public/${req.params.item}-hall.html`));
});

app.get("/api/get/username", async (req, res) => {
    if (!req.session.isLoggedIn) return res.json({ error: "You are not logged in yet" });
    const foundUser = await schemas.Users.findOne({ _id: req.session.userId });
    return res.json({ success: true, username: foundUser.username });
});

// Emojis
app.post("/emoji/update", checkAuth, async (req, res) => {
    try {
        const { emoji } = req.body;

        let result = await update(schemas.Users, {
            _id: req.session.userId
        }, {
            $set: {
                emoji: emoji
            }
        });

        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
});

app.get("/api/get/emoji/other_user", async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) return res.json({
            error: "Server Error: Please include a username field"
        });

        let user = await schemas.Users.findOne({
            username: username
        });

        return res.json({
            success: true,
            emoji: user?.emoji
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
});

// Main
app.get("/signup", (req, res) => {
    if (req.session.isLoggedIn) return res.redirect("/profile");
    return res.sendFile(path.join(__dirname, "public/signup.html"));
});

app.get("/login", (req, res) => {
    if (req.session.isLoggedIn) return res.redirect("/profile");
    return res.sendFile(path.join(__dirname, "public/login.html"))
});

app.get("/profile", async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/login");
    return res.sendFile(path.join(__dirname, "public/profile.html"));
});

app.get("/api/get/profile", checkAuth, async (req, res) => {
    try {
        if (req.currentUser) {
            const { password, ...safeUser } = req.currentUser.toObject();
            return res.json({ success: true, content: safeUser });
        } else {
            return res.json({ error: "Something went wrong" });
        }
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
});

app.post("/change-banner-color", checkAuth, async (req, res) => {
    try {
        const { color } = req.body;
        if (!["#505050", "#9ce68d", "#07E", "#f36565"].includes(color)) return res.json({ error: "Invalid color" });

        let result = await update(schemas.Users, {
            _id: req.session.userId
        }, {
            bannerTheme: color
        });

        if (!result) return res.json({ error: "Can't find your account right now!" });
        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
});

app.post("/api/delete", checkAuth, async (req, res) => {
    try {
        const currentUser = req.currentUser;
        let tempId = `${Date.now()}-${crypto.randomUUID()}-ClosedAccount`;

        const currentGroups = await schemas.Groups.find({ "members.name": currentUser.username }, { "members.$": 1 }).lean();
        for (let group of currentGroups) {
            if (group.members[0].role === "owner") {
                return res.json({ error: "You are currently an owner of a group. Please transfer ownership to close your account" });
            }
        }

        await update(schemas.Posts, { by: currentUser.username }, { $set: { by: tempId } });
        await deleteData(schemas.Images, { by: currentUser.username });
        await deleteData(schemas.Reels, { by: currentUser.username });
        await deleteData(schemas.Reactions, { by: currentUser.username, itemModel: "Reels" });
        await deleteData(schemas.SavesCollection, { madeFrom: currentUser.username });
        await deleteData(schemas.Friends, {
            $or: [
                { sender: currentUser.username },
                { getter: currentUser.username }
            ]
        });
        await pullGroupMember(currentUser.username);

        let userPath = path.join(__dirname, `uploads/${currentUser.username}`);
        if (fs.existsSync(userPath)) {
            await require("fs/promises").rm(userPath, { recursive: true });
        }

        await deleteData(schemas.Users, { _id: currentUser._id });

        req.session.destroy((err) => {
            if (err) {
                console.error("Logout Error during deletion:", err);
                if (!res.headersSent) return res.json({ error: "Server Error" });
            }

            res.clearCookie('connect.sid');
            return res.json({ success: true });
        });

    } catch (e) {
        console.log("Deletion Flow Error: " + e.message);
        if (!res.headersSent) return res.json({ error: "Server Error" });
    }
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Error:", err);
            return res.status(500).json({ error: "Server Error" });
        }

        res.clearCookie('connect.sid');

        return res.status(200).json({ success: true, url: "login" });
    });
});

app.post("/api/keywords", checkAuth, async (req, res) => {
    try {
        let { keywords } = req.body;

        if (!Array.isArray(keywords) || keywords.length === 0) return res.json({ error: "Please enter 1 keyword at least!" });
        keywords = keywords.filter(kw => !req.currentUser.keywords.includes(kw));
        if ((req.currentUser.keywords.length + keywords.length) > 10) return res.json({ error: `You can add a maximum of 10 keywords. You sent ${keywords.length} and currently have ${req.currentUser.keywords.length}.` });
        let bigKeyword = keywords.filter(kw => {
            return kw.length >= 15;
        });
        if (bigKeyword.length > 0) return res.json({ error: "Each keyword must be less than 15 char." });

        const trimmedKeywords = keywords.map(k => k.trim());

        let keywordUpdate = await update(schemas.Users,
            { _id: req.currentUser._id, "keywords.10": { $exists: false } },
            { $push: { keywords: { $each: trimmedKeywords } } }
        );

        if (!keywordUpdate) {
            return res.json({ error: "You can only have 10 keyword. Please remove more to continue!" });
        }

        return res.json({ success: true });
    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/remove/keyword", checkAuth, async (req, res) => {
    try {
        let { keyword } = req.body;

        let keywordUpdate = await update(schemas.Users,
            { _id: req.currentUser._id },
            { $pull: { keywords: keyword.trim() } }
        );

        if (!keywordUpdate) {
            return res.json({ error: "Keyword not found!" });
        }

        return res.json({ success: true });
    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/change/theme", checkAuth, async (req, res) => {
    try {
        await schemas.Users.findByIdAndUpdate(req.session.userId, {
            $set: {
                theme: req.currentUser.theme === "black" ? "white" : "black"
            }
        }, {
            new: true
        });

        res.json({ success: true });
    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/get/id", checkAuth, (req, res) => {
    return res.json({ id: req.session.userId });
});

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const foundUser = await schemas.Users.findOne({ username: username.trim().toLowerCase(), banned: false });
        if (!foundUser) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, foundUser.password);

        if (isMatch) {
            if (foundUser.banned) return res.json({ error: "Your account have been closed for some reason. If you want to appeal, send us an email at requestse@gmail.com" });

            req.session.userId = foundUser._id;
            req.session.isLoggedIn = true;

            return res.json({ success: true });
        } else {
            return res.json({ error: "Invalid credentials" });
        }
    } catch (e) {
        console.error("Login Error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/signup", async (req, res) => {
    try {
        const { username, password, bio, email } = req.body;
        if (!username || !password || !bio || !email) return res.json({ error: "Missing required fields!" });

        if (username.length < 3 || username.length > 20) return res.json({ error: "Username must be between 3 and 20 characters!" });
        if (password.length < 6) return res.json({ error: "Password must be at least 6 characters!" });
        if (bio.length < 20 || bio.length > 40) return res.json({ error: "Bio must be between 20 and 40 characters." });

        let foundEmail = await schemas.Users.findOne({ email: email });
        let foundUsername = await schemas.Users.findOne({ username: username });
        if (foundEmail || foundUsername) {
            return res.json({ error: "User already exists" });
        }

        let generateCodes = ({ count = 10 } = {}) => {
            const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            let codes = [];
            for (let i = 0; i < count; i++) {
                const bytes = crypto.randomBytes(8);
                let code = "";
                for (let j = 0; j < 8; j++) {
                    code += charset[bytes[j] % charset.length];
                    if (j === 3) code += "-";
                }
                codes.push(code);
            }

            return codes.join(" ");
        }

        let fullCodes = [];
        let cleanFullCodes = [];

        for (let i = 0; i < 10; i++) {
            const code = generateCodes();

            fullCodes.push({
                code: await bcrypt.hash(code, 10)
            });
            cleanFullCodes.push(code);
        }

        const newUser = await new schemas.Users({
            email: email.trim().toLowerCase(),
            username: username.trim().toLowerCase(),
            password: await bcrypt.hash(password, 10),
            bio: bio.trim(),
            reported: false,
            recovery_codes: fullCodes,
            emoji: "😂"
        });

        await newUser.save();

        let mainPath = path.join(__dirname, `uploads/${newUser.username}`);
        let reelsPath = path.join(__dirname, `uploads/${newUser.username}/reels`);
        let imagesPath = path.join(__dirname, `uploads/${newUser.username}/images`);

        if (!fs.existsSync(mainPath)) fs.mkdirSync(mainPath);
        if (!fs.existsSync(reelsPath)) fs.mkdirSync(reelsPath);
        if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath);

        req.session.isLoggedIn = true;
        req.session.userId = newUser._id;
        req.session.userData = newUser;
        return res.json({ success: true, codes: cleanFullCodes });
    } catch (e) {
        console.log("Error: " + e.message)
        return res.json({ error: e.message });
    }
});

// Posts
app.post("/set/private/post", checkAuth, async (req, res) => {
    const { id, value } = req.body;
    try {
        let result = await update(schemas.Posts,
            {
                _id: id,
                by: req.currentUser.username,
                anonymous: false
            },
            {
                $set: {
                    private: value ? true : false
                }
            }
        );

        if (!result) {
            return res.json({
                error: "Post not found"
            });
        }

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

app.post("/api/share", checkAuth, async (req, res) => {
    try {
        const { id, shareTo, comment } = req.body;
        if (!shareTo) return res.json({ error: "Please include a shareTo field with the username of the person you want to share to!" });
        let post = await schemas.Posts.findById(id);
        if (!post) return res.json({ error: "Post not found!" });

        let newPost = new schemas.Posts({
            title: post.title,
            content: post.content,
            by: post.by,
            image: post.image,
            keywords: post.keywords,
            private: post.private,
            mentions: post.mentions,
            anonymous: post.anonymous,
            anonymous_name: post.anonymous_name,
            share: true,
            shareId: post.share ? post.shareId : post._id,
            sharedBy: req.currentUser.username,
            shareTo: shareTo,
            shareComment: comment || ""
        });

        await newPost.save();
        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

app.post("/api/comment", checkAuth, async (req, res) => {
    const { id, comment, skip } = req.body;

    try {
        if (!comment?.trim()) return res.json({ error: "Empty" });
        if (comment.length >= 200) return res.json({ error: "Too long" });

        let query = {
            _id: id,
        };

        let result = await schemas.Posts.findOneAndUpdate(query,
            {
                $inc: {
                    commentsCount: 1
                }
            },
            {
                new: true
            }
        );

        if (!result) return res.json({
            error: "Post not found!"
        });

        let newComment = new schemas.Comments({
            comment: comment,
            by: (result.anonymous && !result.share && result.by === req.currentUser.username) ? result.anonymous_name : req.currentUser.username,
            for: id,
        });

        await newComment.save();

        let comments = await schemas.Comments.find({
            for: id
        }).skip(skip || 0).limit(5);

        return res.json({
            success: true,
            comments: comments,
            commentsCount: result.commentsCount
        });
    } catch (e) {
        console.log("Error: " + e.message);
        res.json({ error: "Server Error" });
    }
});

app.post("/api/get/comments/", async (req, res) => {
    try {
        let { posts, skip } = req.body;

        if (skip !== undefined) return res.json({
            success: true,
            fullComments: await schemas.Comments.find({
                for: posts
            }).skip(parseInt(skip) || 0).limit(5)
        });

        const commentPromises = posts.map(async post => {
            let found = await schemas.Comments.find({
                for: post.id
            }).limit(5);

            return found || [];
        });

        const fullComments = await Promise.all(commentPromises);

        return res.json({
            success: true,
            fullComments: fullComments
        });
    } catch (e) {
        console.log("Error: " + e.message);
        res.json({ error: "Server Error" });
    }
});

app.post("/api/:type", checkAuth, async (req, res) => {
    try {
        const { id } = req.body;
        if (!mongoose.isValidObjectId(id)) return res.json({ error: "Invalid id" });
        const type = req.params.type;
        if (!["like", "report", "uphorse", "download"].includes(type)) return res.status(400).json({ error: "Invalid type" });

        const fields = {
            reports: type === "report" ? 1 : 0,
            likes: type === "like" ? 1 : 0,
            downloads: type === "download" ? 1 : 0,
            uphorses: type === "uphorse" ? 1 : 0
        }

        let findQuery = {
            _id: id,
        }

        if (type === "uphorse" && req.currentUser.uphorses <= 0) return res.status(403).json({ error: "You don't have any more uphorses!" });
        if (type === "uphorse") findQuery["uphorses"] = { $lt: 5 };
        if (type !== "download") {
            let newReaction = new schemas.Reactions({
                from: req.currentUser.username,
                id: id,
                type: type,
                itemModel: "Posts"
            });

            await newReaction.save();
        }

        let result = await schemas.Posts(findQuery,
            {
                $inc: fields
            },
            {
                new: true
            }
        );

        if (!result) {
            await deleteData(schemas.Reaction, {
                from: req.currentUser.username,
                id: id,
                type: type,
                itemModel: "Posts"
            });

            return res.status(404).json({ error: "Post not found or it has more than 5 uphorses and you are using the uphorse button." });
        };


        if (type === "uphorse") {
            let userUpdate = await update(schemas.Users, {
                username: req.currentUser.username,
                uphorses: { $gt: 0 }
            }, {
                $inc: {
                    uphorses: -1
                }
            }, {
                new: true
            });

            if (!userUpdate) {
                await await update(schemas.Posts, { _id: id }, { $inc: { uphorses: -1 } });
                return res.status(403).json({ error: "Nice try! You don't have any more uphorses!" });
            }
        }

        return res.status(200).json({ success: true, likes: result.likes, reports: result.reports, downloads: result.downloads, uphorses: result.uphorses });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.status(500).json({
            error: "Server error or you have already done this action"
        });
    }
});

app.get("/get/profile/post/", checkAuth, async (req, res) => {
    try {
        const skip = parseInt(req.query.skip);

        const found = await schemas.Posts.find({
            $or: [
                {
                    by: req.currentUser.username.trim().toLowerCase(),
                    share: false
                },
                {
                    sharedBy: req.currentUser.username.trim().toLowerCase(),
                    share: true
                }
            ]
        }).skip(skip).limit(50).lean();

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

app.get("/get/posts", async (req, res) => {
    try {
        const id = req.query.id;
        const skip = parseInt(req.query.skip);
        const group = req.query.group;

        if (id) {
            let query = await schemas.Posts.findOne({ id: id, groupName: "", private: false });
            return res.json({ post: query });
        }

        let foundUser = await schemas.Users.findById(req.session.userId);

        if (!foundUser) {
            let posts = await schemas.Posts.find({ private: false, share: false, group: "" }
            ).sort({
                createdAt: -1
            }).limit(10);

            posts = posts.sort((a, b) => b.uphorses - a.uphorses);

            return res.json({ success: true, posts: posts });
        }

        const foundFriends = await schemas.Friends.find({
            $or: [
                {
                    sender: foundUser.username,
                    type: "accepted"
                },
                {
                    getter: foundUser.username,
                    type: "accepted"
                }
            ]
        }).limit(250).lean();

        const names = foundFriends.map(friend => {
            return friend.sender === foundUser.username ? friend.getter : friend.sender;
        });

        let findQuery = {
            $or: [
                { keywords: { $in: foundUser.keywords }, private: false, share: false, group: "" },
                { by: foundUser.username, private: false, share: false, group: "" },
                { mentions: foundUser.username, private: false, group: "" },
                { by: { $in: names }, share: false, group: "" },
                { shareTo: foundUser.username, group: "" },
                { sharedBy: foundUser.username, group: "" },
            ]
        }

        if (group) findQuery = {
            group: group,
            private: false
        }

        let posts = await schemas.Posts.find(findQuery)
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(50)
            .lean();

        posts = posts.sort((a, b) => b.uphorses - a.uphorses);

        posts.forEach(post => {
            if (post.anonymous) post.by = post.anonymous_name;
        });

        return res.json({ success: true, posts: posts });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
});

app.post("/create/post", checkAuth, async (req, res) => {
    const { title, content, image, keywords, mentions, anonymous, group } = req.body;

    try {
        if (title.length > 20) return res.json({ error: "Title must be less than 20 characters!" });
        if (content.length > 1000) return res.json({ error: "Content must be less than 1000 characters!" });
        if (!title || !content || !keywords) return res.json({ error: "Required fields missing" });
        if (mentions && mentions.length > 20) return res.json({
            error: "You can only mention 20 user per post!"
        });
        if (keywords.length > 5) return res.json({
            error: "You can add only 5 keywords"
        });
        keywords.push("all");

        let fullMentions = [];
        if (mentions) mentions.forEach(m => {
            fullMentions.push(m.trim().replace("@", ""));
        })

        const postPayload = {
            title,
            content,
            by: req.currentUser.username,
            image: image || "",
            keywords: keywords.map(k => k.trim()) || ["all"],
            private: false,
            mentions: mentions ? fullMentions : [],
            group: group ? group : "",
            anonymous: anonymous ? true : false,
            anonymous_name: anonymous ? `Anonymous-${crypto.randomUUID()}` : undefined
        };

        const newPost = new schemas.Posts(postPayload);
        await newPost.save();

        if (content.length >= 500) {
            await update(schemas.Users, {
                username: req.currentUser.username,
                uphorses: { $lt: 3 }
            }, {
                $inc: {
                    uphorses: 1
                }
            });
        }

        return res.json({ success: true });

    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({ error: "Server Error" });
    }
});

// Reels
app.get("/reels", (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/login");
    return res.sendFile(path.join(__dirname, "public/reels.html"));
});

// Get all
app.get("/get/:item", async (req, res) => {
    try {
        const item = req.params.item;
        const skip = parseInt(req.query.skip);
        let getItem = null;

        if (item === "allUsers") getItem = await schemas.Users.find({ banned: false }).lean().skip(skip).limit(50);
        else if (item === "count") {
            return res.json({ success: true, count: await schemas.Users.countDocuments({}, { hint: "_id_" }) })
        }

        return res.json({
            success: true,
            content: getItem
        });
    } catch (e) {
        console.log("Error: " + e);
        return res.status(500).json({ error: "Server Error" });
    }
});

app.get("/api/get/:type", checkAuth, async (req, res) => {
    try {
        const type = req.params.type;
        if (!type) return res.json({ error: "Dude, I see you didn't pass a type. And.. why?" });
        const skip = parseInt(req.query.skip);
        const noSkip = Boolean(req.query.noSkip);

        if (!noSkip && !Number.isInteger(skip)) return res.json({ error: "Please make sure skip is an int." });
        let found =
            type === "groups" ? await schemas.Groups.find({ "members.name": req.currentUser.username }).skip(skip || 0).limit(10)
                : await schemas.GroupsReq.find({ to: req.currentUser.username }).skip((noSkip && !isNaN(skip)) ? skip : 0).limit((noSkip && !isNaN(skip)) ? 10 : 50);

        return res.json({
            success: true,
            content: found
        });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({
            error: e
        });
    }
});

// Fallback
app.use((req, res, next) => {
    res.send(`
       <h1>404 - Route not found.</h1>
       <p>Make sure you typed the correct URL 🌟</p>
    `);
});

// Listen
app.listen(3000, "0.0.0.0", () => {
    console.log("Live on 3000");
});

