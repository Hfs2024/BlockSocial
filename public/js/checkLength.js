/**
    * Checks if the provided item (array) is empty and, if so, appends a message to the specified parent element.
    * @param {Object} options - The options for the function.
    * @param {Array} options.item - The array to check for length.
    * @param {string} options.html - The HTML content to display if the array is empty.
    * @param {HTMLElement} [options.parent=document] - The parent element to which the message will be appended.
    * @param {string} [options.appendTo] - The selector for the child element of the parent where the message will be appended.
    * @param {Function} [options.action] - An optional function to execute if the array is empty.
    * @param {boolean} [options.tall=false] - A flag to indicate if the message should be styled as tall.
 */

function checkLength({
    item,
    html,
    parent = document,
    appendTo,
    action
} = {}) {
    if (typeof item !== "object") return console.error("Item must be an array!");

    if (!item?.length || item?.length <= 0) {
        const inner = document.createElement("h3");
        inner.classList.add("no-post");
        inner.style.textAlign = "center";
        inner.innerHTML = `${html}`;

        if (action) action();
        parent.querySelector(appendTo).appendChild(inner);
    }
}