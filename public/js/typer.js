const info = document.querySelector(".info");
let textArray = ["Want privacy but couldn't find?", "Do you wish to manage all your messages in one place?", "Are you bored of giant companies toxic tracking?"];
let index = 0;
let interval = null;

function startSession() {
    index = 0;
    for (let text of textArray) {
        setTimeout(() => {
            type(text, info);
        }, index * 4000);

        index += 1;
    };
}

if (textArray.length) {
    startSession();

    interval = setInterval(() => {
        startSession();
    }, textArray.length * 4000);
}

function type(text, el) {
    let buffer = "";
    el.textContent = "";

    for (let i = 0; i < text.length; i++) {
        setTimeout(() => {
            el.textContent += text[i];
        }, i * 50);
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        clearInterval(interval);
    } else {
        startSession();

        interval = setInterval(() => {
            startSession();
        }, textArray.length * 4000);
    }
});