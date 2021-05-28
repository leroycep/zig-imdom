const std = @import("std");

pub fn Gui(comptime UserData: type, renderFn: fn (UserData, *Element) void) type {
    return struct {
        data: UserData,

        pub fn init(allocator: *std.mem.Allocator, userdata: UserData) void {
            const this = allocator.create(@This()) catch unreachable;
            this.data = userdata;
            js.setRenderUserData(@ptrToInt(this));
        }

        pub export fn zig_callRender(this: *@This(), root: *Element) void {
            renderFn(this.data, root);
        }
    };
}

pub const Element = opaque {
    pub fn invalidate(this: *@This()) void {
        js.element_invalidate(this);
    }

    pub const TextOptions = struct {};

    pub fn text(this: *@This(), options: TextOptions, str: []const u8) void {
        // Use the string as the id
        const element = js.element_getOrCreate(this, str.ptr, str.len, .p);
        js.element_setTextContent(element, str.ptr, str.len);
    }

    pub fn textFmt(this: *@This(), options: TextOptions, comptime fmt: []const u8, args: anytype) void {
        const element = js.element_getOrCreate(this, fmt.ptr, fmt.len, .p);
        js.element_setTextContent(element, null, 0);
        const writer = textContentWriter(element);
        writer.print(fmt, args) catch unreachable;
    }

    pub const ButtonOptions = struct {};

    pub fn button(this: *@This(), options: ButtonOptions, str: []const u8) bool {
        const element = js.element_getOrCreate(this, str.ptr, str.len, .button);
        js.element_setTextContent(element, str.ptr, str.len);
        return js.element_wasClicked(element);
    }

    pub fn buttonFmt(this: *@This(), options: ButtonOptions, comptime fmt: []const u8, args: anytype) bool {
        const element = js.element_getOrCreate(this, fmt.ptr, fmt.len, .button);
        js.element_setTextContent(element, null, 0);
        const writer = textContentWriter(element);
        writer.print(fmt, args) catch unreachable;
        return js.element_wasClicked(element);
    }

    pub const InputTextOptions = struct {};

    pub fn inputText(this: *@This(), options: InputTextOptions, label: []const u8, string: *std.ArrayList(u8)) void {
        const element = js.element_getOrCreate(this, label.ptr, label.len, .input);
        js.element_inputText(element, string);
    }
};

fn textContentWrite(element: *Element, bytes: []const u8) error{}!usize {
    js.element_appendTextContent(element, bytes.ptr, bytes.len);
    return bytes.len;
}

fn textContentWriter(element: *Element) std.io.Writer(*Element, error{}, textContentWrite) {
    return .{ .context = element };
}

pub export fn imdom_zig_buffer_resize(arraylist: *std.ArrayList(u8), size: usize) [*]u8 {
    arraylist.resize(size) catch unreachable;
    return arraylist.items.ptr;
}

pub export fn imdom_zig_buffer_ptr(arraylist: *std.ArrayList(u8)) [*]u8 {
    return arraylist.items.ptr;
}

pub export fn imdom_zig_buffer_len(arraylist: *std.ArrayList(u8)) usize {
    return arraylist.items.len;
}

const js = struct {
    pub extern "imdom" fn setRenderUserData(userdata: usize) void;
    pub extern "imdom" fn element_invalidate(element: *Element) void;
    pub extern "imdom" fn element_getOrCreate(element: *Element, id_ptr: [*]const u8, id_len: usize, tt: TagType) *Element;
    pub extern "imdom" fn element_setTextContent(element: *Element, str_ptr: ?[*]const u8, str_len: usize) void;
    pub extern "imdom" fn element_appendTextContent(element: *Element, str_ptr: [*]const u8, str_len: usize) void;
    pub extern "imdom" fn element_wasClicked(element: *Element) bool;
    pub extern "imdom" fn element_inputText(element: *Element, bufferPtr: *std.ArrayList(u8)) void;

    pub const TagType = enum(u32) {
        p,
        button,
        input,
    };
};
