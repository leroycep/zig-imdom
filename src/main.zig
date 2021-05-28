const std = @import("std");
const testing = std.testing;
const env = @import("env.zig");
const imdom = @import("imdom.zig");

pub const log = env.log;
pub const panic = env.panic;

const Data = struct {
    count: u32,
    todos: std.ArrayList(Todo),
    nextTodoId: u64,
};

const Todo = struct {
    id: u64,
    description: std.ArrayList(u8),
};

var gpa = std.heap.GeneralPurposeAllocator(.{ .safety = false }){};
var data_static: Data = undefined;

pub export fn _start() void {
    data_static = .{
        .count = 0,
        .todos = std.ArrayList(Todo).init(&gpa.allocator),
        .nextTodoId = 0,
    };
    imdom.Gui(*Data, render).init(&gpa.allocator, &data_static);
}

pub fn render(data: *Data, root: *imdom.Element) void {
    root.text(.{}, "Hello, world");
    root.text(.{}, "This is an important message");
    if (root.buttonFmt(.{}, "Count: {}", .{data.count})) {
        data.count += 1;
        std.log.info("Button clicked! {}", .{data.count});
    }
    //root.textFmt(.{}, "Name: {s}", .{data.str.items});
    //root.inputText(.{}, "Name", &data.str);
    for (data.todos.items) |*todo, idx| {
        const div = root.divFmt("{}", .{todo.id});
        div.inputText(.{}, "description", &todo.description);
        if (div.button(.{}, "del")) {
            // It's safe to do a swapRemove here because the clicked button means that the
            // everything will need to be rerendered anyway. Not ideal, but eh. I'm lazy.
            _ = data.todos.swapRemove(idx);
        }
    }

    if (root.button(.{}, "New Todo")) {
        data.todos.append(.{
            .id = data.nextTodoId,
            .description = std.ArrayList(u8).init(&gpa.allocator),
        }) catch unreachable;
        data.nextTodoId += 1;
    }
}
