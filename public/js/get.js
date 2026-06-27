async function get(type, id, render = true, saves = false, friends = false, multer = false) {
    let res = null;

    if (id) {
        res = await fetch(`/get/${type}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
            })
        });
    } else {
        res = await fetch(`${multer ? "/multer" : ""}${saves ? "/save" : ""}${friends ? "/friends" : ""}/api/get/${type}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    const data = await res.json();
    if (data.success) {
        return data;
    } else {
        if (render) {
            alert("An error occured: " + data.error);
            return;
        }
    }
};

async function getCustomPost({
    id
}) {
    let api = `/get/posts/?id=${id}`;

    const res = await fetch(api.trim(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    return data;
}

