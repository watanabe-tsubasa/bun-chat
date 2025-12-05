import type { VNode } from "../runtime";

type Page = "home" | "chat";

const Shell = ({ page }: { page: Page }) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Bun Chat</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <div id="app" data-page={page}></div>
      <script type="module" src="/static/index.js"></script>
    </body>
  </html>
);

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function vnodeToHtml(node: any): string {
  if (node === null || node === undefined || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(vnodeToHtml).join("");
  if (typeof node.type === "function") {
    const rendered = (node.type as any)(node.props);
    return vnodeToHtml(rendered);
  }
  const tag = node.type as string;
  const props = node.props ?? {};
  const attrs = Object.entries(props)
    .filter(([key]) => key !== "children" && !key.startsWith("on"))
    .map(([key, value]) => {
      if (value === false || value === null || value === undefined) return null;
      if (value === true) return key;
      return `${key}="${escapeAttr(String(value))}"`;
    })
    .filter(Boolean)
    .join(" ");
  const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
  const children = vnodeToHtml(props.children);
  return `${open}${children}</${tag}>`;
}

export function renderShell(page: Page): string {
  const vnode = (Shell as any)({ page }) as VNode;
  return "<!doctype html>" + vnodeToHtml(vnode);
}
