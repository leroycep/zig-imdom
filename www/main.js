var globalInstance;

const utf8decoder = new TextDecoder();

let logString = "";

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
        }
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
