import { beforeAll, describe, expect, it } from "bun:test";
import { createRenderer, h, render, useEffect, useState } from "./index";
import { ElementNode, TestDocument, TextNode } from "../tests/dom";

beforeAll(() => {
  // @ts-expect-error: test-only document
  globalThis.document = new TestDocument();
});

describe("jsx runtime", () => {
  it("renders text and clamps length", () => {
    const container = new ElementNode("div", document as any);
    render(h("div", null, "hello", "world"), container as any);
    expect(container.textContent).toBe("helloworld");

    const long = "x".repeat(3000);
    render(h("p", null, long), container as any);
    expect(container.textContent?.length).toBe(2000);
  });

  it("useState triggers rerender", () => {
    const container = new ElementNode("div", document as any);
    let setVal: (v: number) => void = () => {};
    const App = () => {
      const [count, setCount] = useState(0);
      setVal = setCount;
      return h("span", null, String(count));
    };
    const renderer = createRenderer(App, container as any);
    renderer.render();
    expect(container.textContent).toBe("0");
    setVal(1);
    expect(container.textContent).toBe("1");
  });

  it("useEffect runs on dependency change only", async () => {
    const container = new ElementNode("div", document as any);
    const calls: number[] = [];
    let setVal: (v: number) => void = () => {};
    const App = () => {
      const [n, setN] = useState(0);
      setVal = setN;
      useEffect(() => {
        calls.push(n);
      }, [n]);
      return h("div", null, String(n));
    };
    const renderer = createRenderer(App, container as any);
    renderer.render();
    setVal(1);
    setVal(1); // should not trigger effect again
    setVal(2);
    await Promise.resolve();
    expect(calls).toEqual([0, 1, 2]);
  });
});
