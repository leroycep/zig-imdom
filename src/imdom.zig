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
        js.element_text(this, str.ptr, str.len, str.ptr, str.len);
    }

    pub const ButtonOptions = struct {};

    pub fn button(this: *@This(), options: ButtonOptions, str: []const u8) bool {
        return js.element_button(this, str.ptr, str.len, str.ptr, str.len);
    }
};

const js = struct {
    pub extern "imdom" fn setRenderUserData(userdata: usize) void;
    pub extern "imdom" fn element_text(element: *Element, id_ptr: [*]const u8, id_len: usize, str_ptr: [*]const u8, str_len: usize) void;
    pub extern "imdom" fn element_button(element: *Element, id_ptr: [*]const u8, id_len: usize, str_ptr: [*]const u8, str_len: usize) bool;
};
