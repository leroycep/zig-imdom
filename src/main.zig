const std = @import("std");
const testing = std.testing;
const env = @import("env.zig");
const imdom = @import("imdom.zig");

pub const log = env.log;
pub const panic = env.panic;

const Data = struct {
    count: u32,
    str: std.ArrayList(u8),
};

var gpa = std.heap.GeneralPurposeAllocator(.{ .safety = false }){};
var data_static: Data = undefined;

pub export fn _start() void {
    data_static = .{
        .count = 0,
        .str = std.ArrayList(u8).init(&gpa.allocator),
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
}
