var globalInstance;

const utf8decoder = new TextDecoder();

let logString = "";
let imdom_userdata = null;
let imdom_rootIdx = null;
let imdom_elements = new Map();
let imdom_elementIdToIdx = {};
let imdom_next_element_idx = 1;
let imdom_shouldRerender = false;

// Used to keep track of which elements are still supposed to exist
let imdom_generation = 0;

function triggerRender() {
    do {
        imdom_generation += 1;

        imdom_shouldRerender = false;
        globalInstance.exports.zig_callRender(imdom_userdata, imdom_rootIdx);
    } while (imdom_shouldRerender);

    // Clean up elements that were not created or updated
    for (const [key, element] of imdom_elements.entries()) {
        // Don't remove the root element!
        if (element.id === "root") continue;

        if (element.generation !== imdom_generation) {
            element.elem.remove();
            imdom_elements.delete(key);
        }
    }
}

let imports = {
    env: {
        log_write(str_ptr, str_len) {
            const buffer = globalInstance.exports.memory.buffer;
            const uint8_array = new Uint8Array(buffer, str_ptr, str_len);
            logString += utf8decoder.decode(uint8_array);
        },

        log_flush() {
            if (logString !== "") {
                console.log(logString);
                logString = "";
            }
        },
    },
    imdom: {
        setRenderUserData(userdata) {
            imdom_userdata = userdata;

            imdom_rootIdx = imdom_next_element_idx;
            imdom_next_element_idx += 1;

            imdom_elements.set(imdom_rootIdx, {
                id: "root",
                elem: document.createElement("div"),
                generation: imdom_generation,
            });
            document.body.appendChild(imdom_elements.get(imdom_rootIdx).elem);

            triggerRender();
        },

        element_invalidate(elementIdx) {
            // TODO: Allow user to create sub-elements and only update it when needed.
            // For now, rerender everything
            imdom_shouldRerender = true;
        },

        element_getOrCreate(parentIdx, id_ptr, id_len, tagTypeId) {
            const buffer = globalInstance.exports.memory.buffer;

            const parent = imdom_elements.get(parentIdx);

            const child_id_bytes = new Uint8Array(buffer, id_ptr, id_len);
            const child_id = utf8decoder.decode(child_id_bytes);
            const id = parent.id + child_id;

            const TAG_TYPES = ["p", "button", "input", "div"];
            const tag_type = TAG_TYPES[tagTypeId];

            let elem_idx = imdom_elementIdToIdx[id];
            let element = null;
            if (!elem_idx || !imdom_elements.has(elem_idx)) {
                elem_idx = imdom_next_element_idx;
                imdom_next_element_idx += 1;

                element = {
                    id: id,
                    idx: elem_idx,
                    elem: document.createElement(tag_type),
                    justConstructed: true,
                };
                parent.elem.appendChild(element.elem);
                imdom_elements.set(elem_idx, element);
                imdom_elementIdToIdx[id] = elem_idx;
            } else {
                element = imdom_elements.get(elem_idx);
                element.justConstructed = false;
            }
            element.generation = imdom_generation;
            return elem_idx;
        },

        element_setTextContent(elementIdx, str_ptr, str_len) {
            const element = imdom_elements.get(elementIdx);

            if (str_ptr === 0) {
                element.elem.textContent = "";
                return;
            }

            const buffer = globalInstance.exports.memory.buffer;

            const str_bytes = new Uint8Array(buffer, str_ptr, str_len);
            const str = utf8decoder.decode(str_bytes);

            element.elem.textContent = str;
        },

        element_appendTextContent(elementIdx, str_ptr, str_len) {
            const element = imdom_elements.get(elementIdx);

            const buffer = globalInstance.exports.memory.buffer;

            const str_bytes = new Uint8Array(buffer, str_ptr, str_len);
            const str = utf8decoder.decode(str_bytes);

            element.elem.textContent += str;
        },

        element_wasClicked(elementIdx) {
            const element = imdom_elements.get(elementIdx);

            if (element.justConstructed) {
                element.elem.addEventListener("click", () => {
                    element.clicked = true;
                    triggerRender();
                });
            }

            if (element.clicked) {
                element.clicked = false;
                // Previous render might be stale at this point
                imdom_shouldRerender = true;
                return true;
            } else {
                return false;
            }
        },

        element_inputText(elementIdx, buffer_ptr) {
            const element = imdom_elements.get(elementIdx);

            if (element.justConstructed) {
                element.elem.type = "text";
                element.elem.addEventListener("input", (e) => {
                    element.haveNewValue = true;
                    triggerRender();
                });
            }

            if (element.haveNewValue) {
                element.haveNewValue = false;
                const value_bytes = new TextEncoder().encode(
                    element.elem.value
                );
                const buffer_items_ptr = globalInstance.exports.imdom_zig_buffer_resize(
                    buffer_ptr,
                    value_bytes.byteLength
                );
                new Uint8Array(
                    globalInstance.exports.memory.buffer,
                    buffer_items_ptr,
                    value_bytes.byteLength
                ).set(value_bytes);

                imdom_shouldRerender = true;
            } else {
                const string_ptr = globalInstance.exports.imdom_zig_buffer_ptr(
                    buffer_ptr
                );
                const string_len = globalInstance.exports.imdom_zig_buffer_len(
                    buffer_ptr
                );
                const string_bytes = new Uint8Array(
                    globalInstance.exports.memory.buffer,
                    string_ptr,
                    string_len
                );
                const string = utf8decoder.decode(string_bytes);
                if (string !== element.elem.value) {
                    element.elem.value = string;
                }
            }
        },
    },
};

fetch("zig-immediate-mode-test.wasm")
    .then((response) => response.arrayBuffer())
    .then((bytes) => WebAssembly.instantiate(bytes, imports))
    .then((results) => results.instance)
    .then((instance) => {
        globalInstance = instance;
        instance.exports._start();
    });
