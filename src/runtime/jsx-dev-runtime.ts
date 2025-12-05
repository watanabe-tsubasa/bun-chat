import { Fragment, h } from "./index";

export { Fragment };

export function jsxDEV(type: any, props: any, key?: any) {
  return h(type, { ...props, key });
}

export const jsx = jsxDEV;
export const jsxs = jsxDEV;
