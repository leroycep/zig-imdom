const std = @import("std");
const testing = std.testing;
const env = @import("env.zig");

pub const log = env.log;

pub fn main() void {
    std.log.info("Hello, world!", .{});
}

test "basic add functionality" {
    try testing.expect(add(3, 7) == 10);
}

