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
    pub const Options = struct {};

    pub fn text(this: *@This(), options: Options, str: []const u8) void {
        js.element_text(this, str.ptr, str.len, str.ptr, str.len);
    }
};

const js = struct {
    pub extern "imdom" fn setRenderUserData(userdata: usize) void;
    pub extern "imdom" fn element_text(element: *Element, id_ptr: [*]const u8, id_len: usize, str_ptr: [*]const u8, str_len: usize) void;
};
