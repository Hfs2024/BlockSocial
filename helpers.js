const schemas = require("./schemas.js");

async function baseController({
    model, find, method, update
}) {
    if (!model) return console.log("You didn't enter a model.");
    if ((typeof find !== "object") || (find === null)) return console.log("Find must be a type of object.");

    let result = null;
    if (update) result = await model?.[method](find, update);
    else result = await model?.[method](find);

    if (!result) return false;
    return true;
};

async function update(model, find, update) {
    let controler = await baseController({ model, find, update, method: "findOneAndUpdate" });
    return controler;
}

async function deleteData(model, find) {
    let controler = await baseController({ model, find, method: "findOneAndDelete" });
    return controler;
}

async function deleteMany(model, find) {
    let controler = await baseController({ model, find, method: "deleteMany" });
    return controler;
}

async function generateCodes({ count = 10 } = {}) {
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

async function pullGroupMember(username) {
    if (!username) return console.log("You didn't enter a username");

    try {
        await schemas.Groups?.updateMany(
            { "members.name": username },
            {
                $pull: {
                    members: {
                        name: username
                    }
                }
            }
        );
    } catch (e) {
        console.log("Error in bulk pullGroupMember: " + e.message);
    }
}

module.exports = {
    update,
    generateCodes,
    deleteData,
    pullGroupMember
}