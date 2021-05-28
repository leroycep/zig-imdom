var globalInstance;

const utf8decoder = new TextDecoder();

let logString = "";
let imdom_userdata = null;
let imdom_rootIdx = null;
let imdom_elements = {};
let imdom_elementIdToIdx = {};
let imdom_next_element_idx = 1;

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

            globalInstance.exports.zig_callRender(userdata, imdom_rootIdx);
        },

        element_text(parentIdx, id_ptr, id_len, str_ptr, str_len) {
            const buffer = globalInstance.exports.memory.buffer;

            const parent = imdom_elements[parentIdx];

            const child_id_bytes = new Uint8Array(buffer, id_ptr, id_len);
            const child_id = utf8decoder.decode(child_id_bytes);
            const id = parent.id + child_id;

            const str_bytes = new Uint8Array(buffer, str_ptr, str_len);
            const str = utf8decoder.decode(str_bytes);

            let elem_idx = imdom_elementIdToIdx[id];
            if (!elem_idx) {
                elem_idx = imdom_next_element_idx;
                imdom_next_element_idx += 1;

                imdom_elements[elem_idx] = {
                    id: id,
                    elem: document.createElement("p"),
                };
                parent.elem.appendChild(imdom_elements[elem_idx].elem);
                imdom_elementIdToIdx[id] = elem_idx;
            }
            imdom_elements[elem_idx].elem.textContent = str;
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
