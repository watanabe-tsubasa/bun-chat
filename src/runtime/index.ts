type Child = VNode | string | number | boolean | null | undefined;

export type VNode = {
  type: string | Function;
  props: Record<string, any> & { children?: Child[] };
};

export const Fragment = (props: { children?: Child[] }) => props.children ?? null;

let currentComponent: Renderer | null = null;
const effectQueue: Array<() => void> = [];

type StateHook<T> = { value: T };
type EffectHook = { deps?: any[]; cleanup?: (() => void) | void };

type Hooks = {
  states: StateHook<any>[];
  effects: EffectHook[];
  stateIndex: number;
  effectIndex: number;
};

type Renderer = {
  hooks: Hooks;
  render: () => VNode;
  container: Element;
};

function createHooks(): Hooks {
  return { states: [], effects: [], stateIndex: 0, effectIndex: 0 };
}

function resetHookIndices(hooks: Hooks) {
  hooks.stateIndex = 0;
  hooks.effectIndex = 0;
}

export function h(type: VNode["type"], props: Record<string, any> | null, ...children: Child[]): VNode {
  let mergedChildren: any;
  if (children.length > 0) {
    mergedChildren = children.flat();
  } else if (props?.children !== undefined) {
    mergedChildren = Array.isArray(props.children) ? props.children : [props.children];
  } else {
    mergedChildren = [];
  }
  return {
    type,
    props: { ...(props ?? {}), children: mergedChildren },
  };
}

function setAttrs(el: Element, props: Record<string, any>) {
  for (const [key, value] of Object.entries(props)) {
    if (key === "children" || value === undefined || value === null) continue;
    if (key === "className") {
      (el as HTMLElement).className = value;
      continue;
    }
    if (key.startsWith("on") && typeof value === "function") {
      const evt = key.slice(2).toLowerCase();
      el.addEventListener(evt, value);
      continue;
    }
    el.setAttribute(key, String(value));
  }
}

function safeText(value: unknown): string {
  // Text nodes are inherently escaped; clamp length to avoid runaway payloads.
  return String(value).slice(0, 2000);
}

function createDom(node: Child): Node {
  if (node === null || node === undefined || node === false || node === true) {
    return document.createTextNode("");
  }
  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(safeText(node));
  }
  if (typeof node.type === "function") {
    // Functional component
    const rendered = (node.type as any)(node.props);
    return createDom(rendered as Child);
  }
  const el = document.createElement(node.type as string);
  setAttrs(el, node.props);
  for (const child of node.props.children ?? []) {
    el.appendChild(createDom(child));
  }
  return el;
}

export function render(vnode: VNode, container: Element) {
  let focusKey: string | null = null;
  let selection: { start: number; end: number } | null = null;
  let composing = false;
  const active =
    (container.ownerDocument as any)?.activeElement ??
    ((globalThis as any).document?.activeElement as HTMLElement | null);
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
    focusKey = active.getAttribute("data-focus-key") ?? active.getAttribute("name") ?? active.id ?? null;
    composing = (active as any).isComposing === true;
    const input = active as any;
    if (!composing && typeof input.selectionStart === "number" && typeof input.selectionEnd === "number") {
      selection = { start: input.selectionStart, end: input.selectionEnd };
    }
  }
  container.replaceChildren(createDom(vnode));
  if (focusKey) {
    const next =
      (container.querySelector(`[data-focus-key="${focusKey}"]`) as HTMLElement | null) ??
      (container.querySelector(`[name="${focusKey}"]`) as HTMLElement | null) ??
      (container.querySelector(`#${focusKey}`) as HTMLElement | null);
    if (next) {
      next.focus?.();
      if (!composing && "setSelectionRange" in next) {
        const len = (next as any).value?.length ?? 0;
        const start = selection ? Math.min(selection.start, len) : len;
        const end = selection ? Math.min(selection.end, len) : len;
        (next as any).setSelectionRange(start, end);
      }
    }
  }
  // Flush effects
  while (effectQueue.length) {
    const fn = effectQueue.shift();
    fn?.();
  }
}

export function createRenderer(view: () => VNode, container: Element) {
  const renderer: Renderer = {
    hooks: createHooks(),
    render: () => {
      currentComponent = renderer;
      resetHookIndices(renderer.hooks);
      const tree = view();
      render(tree, container);
      currentComponent = null;
      return tree;
    },
    container,
  };
  return renderer;
}

export function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  if (!currentComponent) throw new Error("useState must be used inside a render");
  const hooks = currentComponent.hooks;
  const idx = hooks.stateIndex++;
  const slot =
    hooks.states[idx] ??
    (hooks.states[idx] = { value: typeof initial === "function" ? (initial as any)() : initial });
  const componentRef = currentComponent;
  const setState = (value: T | ((prev: T) => T)) => {
    const nextValue = typeof value === "function" ? (value as any)(slot.value) : value;
    if (Object.is(nextValue, slot.value)) return;
    slot.value = nextValue;
    componentRef?.render();
  };
  return [slot.value as T, setState];
}

export function useEffect(effect: () => void | (() => void), deps?: any[]) {
  if (!currentComponent) throw new Error("useEffect must be used inside a render");
  const hooks = currentComponent.hooks;
  const idx = hooks.effectIndex++;
  const slot: EffectHook = hooks.effects[idx] ?? (hooks.effects[idx] = {});
  const prev = slot;
  const depsChanged =
    !prev || !deps || !prev.deps || deps.length !== prev.deps.length || deps.some((d, i) => !Object.is(d, prev.deps![i]));
  if (depsChanged) {
    effectQueue.push(() => {
      prev?.cleanup?.();
      const cleanup = effect();
      slot.cleanup = cleanup;
      slot.deps = deps;
    });
  }
}

export function cleanupEffects(renderer: Renderer) {
  for (const effect of renderer.hooks.effects) {
    if (typeof effect?.cleanup === "function") {
      effect.cleanup();
    }
  }
}
