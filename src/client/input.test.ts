import { describe, expect, it } from "bun:test";
import { createInputHandlers } from "./input";

describe("createInputHandlers", () => {
  it("updates value on normal input", () => {
    let value = "";
    const handlers = createInputHandlers((v) => (value = v));
    handlers.onInput({ target: { value: "abc" }, isComposing: false });
    expect(value).toBe("abc");
  });

  it("defers update until composition end", () => {
    let value = "";
    const handlers = createInputHandlers((v) => (value = v));
    handlers.onCompositionstart({});
    handlers.onInput({ target: { value: "あ" }, isComposing: true });
    expect(value).toBe("");
    handlers.onCompositionend({ target: { value: "あ" } });
    expect(value).toBe("あ");
  });

  it("handles multi-char IME composition (sya -> しゃ)", () => {
    let value = "";
    const handlers = createInputHandlers((v) => (value = v));
    handlers.onCompositionstart({});
    handlers.onInput({ target: { value: "s" }, isComposing: true });
    handlers.onInput({ target: { value: "sy" }, isComposing: true });
    handlers.onInput({ target: { value: "sya" }, isComposing: true });
    expect(value).toBe(""); // no commit yet
    handlers.onCompositionend({ target: { value: "しゃ" } });
    expect(value).toBe("しゃ");
  });

  it("updates on rapid non-IME typing", () => {
    let value = "";
    const handlers = createInputHandlers((v) => (value = v));
    for (const ch of ["a", "s", "d", "f"]) {
      handlers.onInput({ target: { value: (value || "") + ch }, isComposing: false });
    }
    expect(value).toBe("asdf");
  });
});
