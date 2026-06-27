const fs = require("fs");
const express = require("express");
const path = require("path");
const multer = require("multer");
const schemas = require("./schemas");
const { checkAuth } = require("./checkAuth.js");
const router = express.Router();
let UPLOAD_PATH = "JSONStorage";

const JSONStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const JSONFilter = (req, file, cb) => {
    const extName = path.extname(file.originalname).toLowerCase() === ".jsonl";

    if (extName) {
        cb(null, true);
    } else {
        const error = new Error('File type is not allowed. Only Only JSONL (.jsonl) is allowed!');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

const uploadJSON = multer({
    storage: JSONStorage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
    fileFilter: JSONFilter
}).single("JSONFile");

router.get("/", (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/login");
    return res.sendFile(
        path.join(__dirname, "public/upload-json.html")
    );
})

router.post('/', checkAuth, async (req, res) => {
    uploadJSON(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }

        const removeFile = () => {
            fs.unlink(filePath, (err) => {
                if (err) console.log("File cleanup error: " + err.message);
                else console.log("File removed!");
            });
        }

        if (req.file.size > 3 * 1024 * 1024) {
            removeFile();
            return res.json({ error: "File too large" });
        }

        const filePath = req.file.path;
        const rl = require("readline").createInterface({
            input: fs.createReadStream(filePath)
        });
        const BATCH_SIZE = 200;
        let holder = [];
        let error = false;

        try {
            for await (let line of rl) {
                try {
                    const parsedLine = JSON.parse(line);
                    parsedLine["by"] = req.currentUser.username;
                    holder.push(parsedLine);
                } catch (e) {
                    console.log("Error parsing JSON: " + e);
                    error = true;
                    continue;
                }

                if (holder.length >= BATCH_SIZE) {
                    const batchToInsert = [...holder];
                    holder = [];

                    await schemas.Posts.insertMany(batchToInsert, { ordered: false })
                        .catch(err => {
                            console.log("Insert Batch Error: " + err);
                        });
                }
            }

            if (holder.length > 0) {
                await schemas.Posts.insertMany(holder, { ordered: false })
                    .catch(err => console.log("Insert Remainder Error: " + err));
            }

            if (!error) {
                res.json({ success: true, message: 'File uploaded successfully' });
            } else {
                res.status(400).json({ error: "This file contains wrong JSONL format!" });
            }

        } catch (streamErr) {
            console.log("Stream error: " + streamErr);
            if (!res.headersSent) res.status(500).json({ error: "Server streaming error" });
        } finally {
            removeFile();
        }
    });
});

module.exports = {
    router
};
