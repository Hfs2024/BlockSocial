
async function getUserTheme(...others) {
    const res = await fetch("/api/get/profile", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    if (data.success) {
        const content = data.content;
        if (content.theme === "black") {
            document.body.classList.add("dark");
            others.forEach(other => {
                other.classList.add("dark-object");
            });
        }

        return data.content.theme;
    };
}

export {
    getUserTheme
}