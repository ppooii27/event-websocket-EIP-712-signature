import EventEmitter from "./eventEmitter";

describe("on + emit", () => {
  test("calls handler with payload", async () => {
    const bus = new EventEmitter<{ ping: { msg: string } }>();
    const fn = jest.fn();

    bus.on("ping", fn);
    await bus.emit("ping", { msg: "hello" });

    expect(fn).toHaveBeenCalledWith({ msg: "hello" });
  });

  test("calls muliple handlers for the same event", async () => {
    const bus = new EventEmitter<{ ping: { msg: string } }>();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    bus.on("ping", fn1);
    bus.on("ping", fn2);
    await bus.emit("ping", { msg: "hello" });

    expect(fn1).toHaveBeenCalledWith({ msg: "hello" });
    expect(fn2).toHaveBeenCalledWith({ msg: "hello" });
  });
});

describe("off", () => {
  test("removes handler, no longer called after off", async () => {
    const bus = new EventEmitter<{ ping: {} }>();
    const fn = jest.fn();

    bus.on("ping", fn);
    bus.off("ping", fn);
    await bus.emit("ping", {});

    expect(fn).not.toHaveBeenCalled();
  });

  test("off on non-existent event does not throw", () => {
    const bus = new EventEmitter<{ ping: {} }>();
    const fn = jest.fn();

    expect(() => bus.off("ping", fn)).not.toThrow();
  });
});

describe("emit", () => {
  test("emit with no handlers does not throw", () => {
    const bus = new EventEmitter<{ ping: {} }>();
    expect(() => bus.emit("ping", {})).not.toThrow();
  });
});
