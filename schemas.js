const mongoose = require("mongoose");

// Reports
const reportConn = mongoose.createConnection(process.env.MONGO_URI);
const reportSchema = new mongoose.Schema({
    userId: String,
    reason: String,
    username: String,
    reporter: String,
    email: String
}, { timestamps: true });
let Reports = reportConn.model("Reports", reportSchema, "reports");

// Reactions
const reactionsConn = mongoose.createConnection(process.env.MONGO_URI);
const reactionsSchema = new mongoose.Schema({
    type: String,
    from: String,
    id: String,
    itemModel: {
        type: String,
        required: true,
        enum: ['Posts', 'Reels']
    }
}, { timestamps: true });
reactionsSchema.index({ from: 1, id: 1, type: 1, itemModel: 1 }, { unique: true });
let Reactions = reactionsConn.model("Reactions", reactionsSchema, "reactions");

// Friends
const friendsConn = mongoose.createConnection(process.env.MONGO_URI);
const friendsSchema = new mongoose.Schema({
    sender: String,
    getter: String,
    addedAt: String,
    type: String
}, { timestamps: true });
let Friends = friendsConn.model("Friends", friendsSchema, "friends");

// Posts
let postsConn = mongoose.createConnection(process.env.MONGO_URI);
let postsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String
    },

    uphorses: {
        type: Number,
        default: 0
    },

    likes: {
        type: Number,
        default: 0
    },

    downloads: {
        type: Number,
        default: 0
    },
    commentsCount: {
        type: Number,
        default: 0
    },
    reports: {
        type: Number,
        default: 0
    },
    by: {
        type: String
    },

    keywords: {
        type: [String]
    },
    private: {
        type: Boolean,
        default: false
    },
    mentions: [String],
    anonymous: {
        type: Boolean,
        default: false
    },
    anonymous_name: {
        type: String,
        default: undefined
    },
    share: {
        type: Boolean,
        default: false
    },
    shareId: String,
    sharedBy: String,
    shareTo: String,
    shareComment: String,
    group: {
        type: String,
        default: ""
    }
}, { timestamps: true });
let Posts = postsConn.model("Posts", postsSchema, "posts");

// Users
let usersConn = mongoose.createConnection(process.env.MONGO_URI);
let usersSchema = new mongoose.Schema({
    reported: Boolean,
    banned: {
        type: Boolean,
        default: false
    },
    uphorses: {
        type: Number,
        default: 3
    },
    recovery_codes: [{
        code: String,
    }],

    emoji: String,

    username: {
        type: String,
        min: 4,
        unique: true,
        required: true
    },
    password: {
        type: String,
        min: 8,
        required: true
    },
    email: {
        type: String,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        required: true
    },
    theme: {
        type: String,
        default: "white"
    },
    keywords: {
        type: [String]
    },

    joinedGroupsLength: {
        type: Number,
        default: 0
    },

    bio: String,

    bannerTheme: {
        type: String,
        default: "#505050",
        enum: ["#505050", "#9ce68d", "#07E", "#f36565"]
    }
}, { timestamps: true });
let Users = usersConn.model("Users", usersSchema, "users");

// Support Articles
const supportConn = mongoose.createConnection(process.env.MONGO_URI);
const supportSchema = new mongoose.Schema({
    title: String,
    content: String,
    createdAt: String,
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    reactionsBy: [{
        name: String,
        at: String,
        reactionType: String
    }],
}, { timestamps: true });
let SupportArticles = supportConn.model("SupportArticles", supportSchema, "support_articles");

// Saves Collections
const collectionsConn = mongoose.createConnection(process.env.MONGO_URI);
const collectionsSchema = new mongoose.Schema({
    saves: [{
        id: String,
        title: String
    }],
    name: String,
    madeFrom: String
}, { timestamps: true });
let SavesCollection = collectionsConn.model("SavesCollections", collectionsSchema, "saves_collections"); 7

// Reels
const reelsConn = mongoose.createConnection(process.env.MONGO_URI);
const reelsSchema = new mongoose.Schema({
    path: String,
    by: String,
    likes: {
        type: Number,
        default: 0
    },
    reports: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
let Reels = reelsConn.model("Reels", reelsSchema, "reels");

// Comment
const commentsConn = mongoose.createConnection(process.env.MONGO_URI);
const commentsSchema = new mongoose.Schema({
    comment: String,
    for: String,
    by: String
}, { timestamps: true });
let Comments = commentsConn.model("Comments", commentsSchema, "comments");

// Images
const imagesConn = mongoose.createConnection(process.env.MONGO_URI);
const imagesSchema = new mongoose.Schema({
    path: String,
    by: String,
    fav: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
let Images = imagesConn.model("Images", imagesSchema, "images");

// Groups
const groupsConn = mongoose.createConnection(process.env.MONGO_URI);
const groupSchema = new mongoose.Schema({
    name: String,
    desc: String,
    members: [{
        name: String,
        role: {
            type: String,
            default: "member"
        }
    }],
    membersCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
let Groups = groupsConn.model("Groups", groupSchema, "groups");

// Groups request
const groupsReqConn = mongoose.createConnection(process.env.MONGO_URI);
const groupReqSchema = new mongoose.Schema({
    from: String,
    to: String,
    groupName: String
}, { timestamps: true });
let GroupsReq = groupsReqConn.model("GroupsReq", groupReqSchema, "groups_req");

module.exports = {
    Users,
    Posts,
    SupportArticles,
    SavesCollection,
    Reactions,
    Reels,
    Comments,
    Friends,
    Reports,
    Images,
    Groups,
    GroupsReq
}