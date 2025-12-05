import { Fragment, h } from "./index";

export { Fragment };

export function jsx(type: any, props: any, _key?: any) {
  return h(type, props);
}

export const jsxs = jsx;
