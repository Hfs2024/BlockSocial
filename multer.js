const multer = require('multer');
const fs = require("fs");
const path = require("path");
const express = require("express");
const sharp = require("sharp");
const schemas = require("./schemas.js");
const { checkAuth } = require('./checkAuth.js');
const crypto = require("crypto");
const mongoose = require('mongoose');
const { deleteData, update, deleteMany } = require("./helpers.js");
const router = express.Router();
let UPLOAD_PATH = "uploads/";

router.use(checkAuth);

if (!fs.existsSync(UPLOAD_PATH)) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        UPLOAD_PATH = `uploads/${req.currentUser.username}/reels`;
        cb(null, UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const videoFileFilter = (req, file, cb) => {
    const allowedTypes = /wmv|webm|mkv|mov|avi|mp4/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        const error = new Error('File type is not allowed. Only videos are allowed (.wmv, .webm, .mkv, .mov, .avi, .mp4)');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

const imageStorage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        const error = new Error('File type is not allowed. Only images are allowed (.jpg, .jpeg, .png, .gif, .webp)');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: videoFileFilter
}).single("myFile");

const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 5MB
    fileFilter: imageFileFilter
}).single("image");

router.use(express.json());

router.post("/reel/:type", checkAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const type = req.params.type;
        if (!mongoose.isValidObjectId(id)) return res.json({ error: "Invalid id" }); // Not added in other routes, because they only read, not write.

        let newReaction = new schemas.Reactions({
            from: req.currentUser.username,
            id: id,
            type: type,
            itemModel: "Reels"
        });

        await newReaction.save();

        let result = await schemas.Reels({
            _id: id
        }, {
            $inc: {
                likes: type === "like" ? 1 : 0,
                reports: type === "report" ? 1 : 0
            }
        }, {
            new: true
        });

        if (!result) {
            await deleteData(schemas.Reactions, {
                from: req.currentUser.username,
                id: id,
                type: type,
                itemModel: "Reels"
            });

            return res.json({ error: "Reel not found" });
        }

        return res.json({ success: true, likes: result.likes, reports: result.reports });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server error or you already liked this reel"
        });
    }
});

router.post("/addToFav", checkAuth, async (req, res) => {
    try {
        const { value, id } = req.body;

        let result = await update(schemas.Images, {
            _id: id,

        }, {
            $set: {
                fav: value ? true : false
            }
        });

        if (!result) return res.json({ error: "Image not found!" });
        return res.json({ success: true });
    } catch (e) {
        console.log("Error: " + e);
        return res.json({
            error: "Server Error"
        });
    }
});

router.post("/delete-:type", checkAuth, async (req, res) => {
    try {
        const { path, id } = req.body;
        const type = req.params.type;
        let result = "";
        if (!path || !id) return res.json({ error: "Please provide a path and ID!" });
        const fullPath = require("path").join(__dirname, path);

        if (type === "image") {
            let foundPost = await schemas.Posts.findOne({ image: path });
            if (foundPost) return res.json({ error: "This image is attached to a post. If you want to delete it, please delete it from your profile." });
        }

        if (fs.existsSync(fullPath)) fs.unlink(fullPath, (err) => {
            if (err) console.log("Error: " + err);
        });

        if (type === "image") result = await deleteData(schemas.Images, {
            _id: id,
            by: req.currentUser.username
        });
        else {
            result = await schemas.Reels.findOneAndDelete({
                _id: id,
                by: req.currentUser.username
            });

            if (result) await deleteMany(schemas.Reactions, { id: result._id, itemModel: "Reels" });
        }

        if (!result) return res.json({
            error: `${type === "image" ? "Image" : "Reel"} not found!`
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

router.get("/api/get/:type", checkAuth, async (req, res) => {
    try {
        const skip = parseInt(req.query.skip);
        let type = req.params.type;
        let found = "";
        if (!type) return res.json({ error: "Bro, why you didn't you insert a type?" });
        if (!Number.isInteger(skip)) return res.json({ error: "Please pass a correct number!" });

        if (type === "uploads") found = await schemas.Reels.find({}).skip(skip || 0).limit(10);
        else found = await schemas[type].find({ by: req.currentUser.username }).skip(skip || 0).limit(10);

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

router.post('/upload', checkAuth, async (req, res) => {
    uploadVideo(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }

        try {
            const fullPath = `/uploads/${req.currentUser.username}/reels/${req.file.filename}`;

            let newReel = new schemas.Reels({
                path: fullPath,
                by: req.currentUser.username
            });

            await newReel.save();

            let count = await schemas.Reels.countDocuments({
                createdBy: req.currentUser.username
            });

            if (count >= 200) {
                await schemas.Reels.deleteOne({
                    path: fullPath,
                    by: req.currentUser.username
                });

                if (fs.existsSync(path.join(__dirname, fullPath))) fs.unlinkSync(path.join(__dirname, fullPath));

                return res.json({ error: "Your have reached you 200 reels limt. Please delete old images to create new ones" });
            }

            res.json({ success: true, message: 'File uploaded successfully', filename: req.file.filename });
        } catch (e) {
            console.log("Error: " + e.message);
            return res.json({
                error: "Server Error"
            });
        }
    });
});

router.post('/upload-image', checkAuth, async (req, res) => {
    uploadImage(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            let id = crypto.randomUUID();
            let fullName = `/uploads/${req.currentUser.username}/images/opt-${id}-${req.file.originalname}`;
            const newImageUrl = path.join(__dirname, fullName);

            await sharp(req.file.buffer)
                .resize(1200, 1200)
                .webp({
                    quality: 80
                })
                .toFile(newImageUrl, async (err, data) => {
                    try {
                        if (err) {
                            console.log("Error: " + err.message);
                            return res.json({
                                error: "Failed to optomize image. Please try again later"
                            });
                        }

                        let newImage = new schemas.Images({
                            path: fullName,
                            by: req.currentUser.username
                        });

                        await newImage.save();

                        let count = await schemas.Images.countDocuments({
                            by: req.currentUser.username
                        });

                        if (count > 800) {
                            await schemas.Images.deleteOne({
                                path: fullName,
                                by: req.currentUser.username
                            });

                            if (fs.existsSync(fs.unlinkSync(newImageUrl))) fs.unlinkSync(newImageUrl);

                            return res.json({ error: "Your have reached you 800 images limt. Please delete old images to create new ones" });
                        }

                        res.json({ success: true, imageUrl: fullName, message: 'Image uploaded successfully' });
                    } catch (e) {
                        console.log("Error: " + e.message);
                    }
                });
        } catch (e) {
            console.log("Error: " + e.message);
            return res.json({
                error: "Server Error"
            });
        }
    });
});

module.exports = { uploadVideo, uploadImage, router }; 
