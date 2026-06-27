const express = require("express");
const schemas = require("./schemas.js");
const router = express.Router();
const { checkAuth } = require("./checkAuth.js");

router.get("/get/collections", checkAuth, async (req, res) => {
    try {
        let userCollections = await schemas.SavesCollection.find({
            madeFrom: req.currentUser.username
        }).lean().limit(250);

        return res.json({
            success: true,
            collections: userCollections
        });
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
});

router.post("/add/collection", checkAuth, async (req, res) => {
    const { name } = req.body;

    try {
        let currentUserCollections = await schemas.SavesCollection.find({
            madeFrom: req.currentUser.username
        }).lean();

        if (currentUserCollections.length > 250) return res.json({
            error: 'You can only create 250 collection!'
        });

        let newCollection = await schemas.SavesCollection({
            name: name,
            madeFrom: req.currentUser.username
        });

        await newCollection.save();

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

router.post("/delete/collection", checkAuth, async (req, res) => {
    const { name } = req.body;

    try {
        let result = await schemas.SavesCollection.findOneAndDelete(
            {
                name: name,
                madeFrom: req.currentUser.username
            },
            {
                new: true
            }
        );

        if (!result) return res.json({
            error: "Collection not found!"
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

router.post("/delete/collection/item/", checkAuth, async (req, res) => {
    try {
        const { id, collection } = req.body;

        let result = await schemas.SavesCollection.findOneAndUpdate(
            {
                madeFrom: req.currentUser.username,
                name: collection
            },
            {
                $pull: {
                    saves: { _id: id }
                }
            },
            {
                new: true
            }
        );

        if (!result) return res.json({
            error: "Collection not found!"
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

router.get("/api/get/saves", checkAuth, async (req, res) => {
    const skip = req.query.skip;

    try {
        return res.json({
            success: true,
            data: await schemas.SavesCollection.find({
                madeFrom: req.currentUser.username
            }).skip(skip).limit(50).lean()
        })
    } catch (e) {
        console.log("Error: " + e.message);
        return res.json({
            error: "Server Error"
        });
    }
})

router.post("/rename/collection", checkAuth, async (req, res) => {
    const { newName, oldName } = req.body;

    try {
        let alreadyExit = await schemas.SavesCollection.findOne({
            name: newName,
            madeFrom: req.currentUser.username
        });
        if (alreadyExit) return res.json({
            error: "A collection with this name already exits!"
        });

        let result = await schemas.SavesCollection.findOneAndUpdate(
            {
                name: oldName,
                name: {
                    $ne: newName
                },
                madeFrom: req.currentUser.username
            },
            {
                $set: {
                    name: newName
                }
            },
            {
                new: true
            }
        );

        if (!result) return res.json({
            error: "Collection not found or it's already this name!"
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

router.post("/rename/save", async (req, res) => {
    try {
        const { newName, saveId, cardId } = req.body;
        if (!newName || !saveId || !cardId) return res.json({ error: "Please include all the fields." });
        if (newName.length > 20) return res.json({ error: "Name too tall!" });

        let result = await schemas.SavesCollection.findOneAndUpdate(
            { _id: saveId, "saves._id": cardId },
            { $set: { "saves.$.title": newName } },
            { new: true }
        );

        if (!result) return res.json({ error: "Can't find this save!" });

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

router.post("/post", checkAuth, async (req, res) => {
    const { id, title, saveTo } = req.body;

    try {
        if (!saveTo) return res.json({
            error: "You didn't choose a collection!"
        });

        let result = await schemas.SavesCollection.findOneAndUpdate(
            {
                name: saveTo,
                madeFrom: req.currentUser.username,
                "saves.id": {
                    $ne: id
                },
                $expr: { $lt: [{ $size: "$saves" }, 100] }
            },
            {
                $push: {
                    saves: {
                        id: id,
                        title: title
                    }
                }
            },
            {
                new: true
            }
        );

        if (!result) return res.json({
            error: "Couldn't find this collection, post is already there or this collection already contains 100 posts!"
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

module.exports = {
    router
};
