const std = @import("std");

pub fn Gui(comptime UserData: type, renderFn: fn (UserData, *Element) void) type {
    return struct {
        data: UserData,

        pub fn init(allocator: *std.mem.Allocator, userdata: UserData) void {
            const this = allocator.create(@This()) catch unreachable;
            js.setRenderUserData(@ptrToInt(this));
        }

        pub export fn zig_callRender(this: *@This(), root: *Element) void {
            renderFn(this.data, root);
        }
    };
}

pub const Element = opaque {
    pub const TextOptions = struct {};

    pub fn text(this: *@This(), options: TextOptions, str: []const u8) void {
        // Use the string as the id
        const element = js.element_getOrCreate(this, str.ptr, str.len, .p);
        js.element_setTextContent(element, str.ptr, str.len);
    }

    pub const ButtonOptions = struct {};

    pub fn button(this: *@This(), options: ButtonOptions, str: []const u8) bool {
        const element = js.element_getOrCreate(this, str.ptr, str.len, .button);
        js.element_setTextContent(element, str.ptr, str.len);
        return js.element_wasClicked(element);
    }
};

const js = struct {
    pub extern "imdom" fn setRenderUserData(userdata: usize) void;
    pub extern "imdom" fn element_getOrCreate(element: *Element, id_ptr: [*]const u8, id_len: usize, tt: TagType) *Element;
    pub extern "imdom" fn element_setTextContent(element: *Element, str_ptr: [*]const u8, str_len: usize) void;
    pub extern "imdom" fn element_wasClicked(element: *Element) bool;

    pub const TagType = enum(u32) {
        p,
        button,
    };
};
