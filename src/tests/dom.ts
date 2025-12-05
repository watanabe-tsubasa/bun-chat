export class TextNode {
  constructor(public data: string) {}
  get textContent() {
    return this.data;
  }
  set textContent(val: string) {
    this.data = val;
  }
}

export class ElementNode {
  children: Array<ElementNode | TextNode> = [];
  attributes: Record<string, string> = {};
  dataset: Record<string, string> = {};
  className = "";
  id = "";
  name = "";
  ownerDocument: TestDocument;
  selectionStart: number | null = null;
  selectionEnd: number | null = null;
  isComposing = false;
  value: string = "";
  get tagName() {
    return this.tag.toUpperCase();
  }

  constructor(public tag: string, owner: TestDocument) {
    this.ownerDocument = owner;
  }

  setAttribute(key: string, value: string) {
    this.attributes[key] = value;
    if (key === "id") this.id = value;
    if (key === "name") this.name = value;
    if (key === "value") this.value = value;
    if (key.startsWith("data-")) {
      const k = key.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[k] = value;
    }
  }

  getAttribute(key: string) {
    if (key.startsWith("data-")) {
      const k = key.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return this.dataset[k];
    }
    return this.attributes[key];
  }

  addEventListener() {
    // no-op for tests
  }

  appendChild(node: ElementNode | TextNode) {
    this.children.push(node);
  }

  replaceChildren(...nodes: Array<ElementNode | TextNode>) {
    this.children = nodes;
  }

  get textContent(): string {
    return this.children.map((c) => c.textContent ?? "").join("");
  }

  set textContent(val: string) {
    this.children = [new TextNode(String(val))];
  }

  setSelectionRange(start: number, end: number) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }

  querySelector(selector: string): ElementNode | null {
    const matchAttr = (key: string, value: string) => {
      if (key === "id") return this.id === value;
      if (key === "name") return this.name === value;
      if (key.startsWith("data-")) {
        const v = this.getAttribute(key);
        return v === value;
      }
      return false;
    };

    const search = (node: ElementNode): ElementNode | null => {
      if (selector.startsWith("#") && matchAttr("id", selector.slice(1))) return node;
      const dataMatch = selector.match(/^\[data-([^\]]+)="(.+)"\]$/);
      if (dataMatch) {
        const [, key, val] = dataMatch;
        if (key && val && matchAttr(`data-${key}`, val)) return node;
      }
      const nameMatch = selector.match(/^\[name="(.+)"\]$/);
      if (nameMatch) {
        const [, val] = nameMatch;
        if (val && matchAttr("name", val)) return node;
      }
      for (const child of node.children) {
        if (child instanceof ElementNode) {
          const res = search(child);
          if (res) return res;
        }
      }
      return null;
    };

    for (const child of this.children) {
      if (child instanceof ElementNode) {
        const res = search(child);
        if (res) return res;
      }
    }
    return null;
  }
}

export class TestDocument {
  private elements: Record<string, ElementNode> = {};
  activeElement: ElementNode | null = null;

  createElement(tag: string) {
    const el = new ElementNode(tag, this);
    return el;
  }

  createTextNode(text: string) {
    return new TextNode(text);
  }

  getElementById(id: string) {
    return this.elements[id] ?? null;
  }

  registerElement(el: ElementNode) {
    if (el.id) {
      this.elements[el.id] = el;
    }
  }
}
