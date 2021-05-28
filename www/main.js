var globalInstance;

const utf8decoder = new TextDecoder();

let logString = "";
let imdom_userdata = null;
let imdom_rootIdx = null;
let imdom_elements = {};
let imdom_elementIdToIdx = {};
let imdom_next_element_idx = 1;

function triggerRender() {
    globalInstance.exports.zig_callRender(imdom_userdata, imdom_rootIdx);
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

            imdom_elements[imdom_rootIdx] = {
                id: "root",
                elem: document.createElement("div"),
            };
            document.body.appendChild(imdom_elements[imdom_rootIdx].elem);

            triggerRender();
        },

        element_getOrCreate(parentIdx, id_ptr, id_len, tagTypeId) {
            const buffer = globalInstance.exports.memory.buffer;

            const parent = imdom_elements[parentIdx];

            const child_id_bytes = new Uint8Array(buffer, id_ptr, id_len);
            const child_id = utf8decoder.decode(child_id_bytes);
            const id = parent.id + child_id;

            const TAG_TYPES = ["p", "button"];
            const tag_type = TAG_TYPES[tagTypeId];

            let elem_idx = imdom_elementIdToIdx[id];
            if (!elem_idx) {
                elem_idx = imdom_next_element_idx;
                imdom_next_element_idx += 1;

                imdom_elements[elem_idx] = {
                    id: id,
                    idx: elem_idx,
                    elem: document.createElement(tag_type),
                };
                parent.elem.appendChild(imdom_elements[elem_idx].elem);
                imdom_elementIdToIdx[id] = elem_idx;
            }
            return elem_idx;
        },

        element_setTextContent(elementIdx, str_ptr, str_len) {
            const element = imdom_elements[elementIdx];

            const buffer = globalInstance.exports.memory.buffer;

            const str_bytes = new Uint8Array(buffer, str_ptr, str_len);
            const str = utf8decoder.decode(str_bytes);

            element.elem.textContent = str;
        },

        element_wasClicked(elementIdx) {
            const element = imdom_elements[elementIdx];

            element.elem.onclick = () => {
                element.clicked = true;
                triggerRender();
            };

            if (element.clicked) {
                element.clicked = false;
                return true;
            } else {
                return false;
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
