const std = @import("std");

pub fn log(
    comptime message_level: std.log.Level,
    comptime scope: @Type(.EnumLiteral),
    comptime format: []const u8,
    args: anytype,
) void {
    const writer = logWriter();
    defer log_flush();
    writer.print("[{s}][{s}] ", .{ std.meta.tagName(message_level), std.meta.tagName(scope) }) catch {};
    writer.print(format, args) catch {};
}

pub extern "env" fn log_write(str_ptr: [*]const u8, str_len: usize) void;
pub extern "env" fn log_flush() void;

fn logWrite(write_context: void, bytes: []const u8) error{}!usize {
    log_write(bytes.ptr, bytes.len);
    return bytes.len;
}

fn logWriter() std.io.Writer(void, error{}, logWrite) {
    return .{ .context = {} };
}

export fn _start() void {
    @import("root").main();
}

