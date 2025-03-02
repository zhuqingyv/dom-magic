import { safeMap } from "./utils/utils";
import { createComment, createTextNode, equallyElement } from "./document";
import { subscribe } from './domFactory';
import { isReactive } from '../reactive';

type ChildType = HTMLElement | string | number | ChildType[] | (() => ChildType);
type DOMNodeType = HTMLElement | Text | Comment;

const childSetter = function (child: ChildType): DOMNodeType | DOMNodeType[] {
  if (child instanceof HTMLElement) {
    return child;
  }
  else if (typeof child === "string" || typeof child === "number") {
    return createTextNode(String(child));
  }
  else if (Array.isArray(child)) {
    return child.map(childSetter).flat();
  }
  else if (isReactive(child)) {
    let anchor: HTMLElement | Comment = createComment('');
    const update = () => {
      const newChild = childSetter(child());
      const newElement = Array.isArray(newChild) ? newChild[0] : newChild;
      if (newElement && !equallyElement(newElement, anchor)) {
        anchor.replaceWith(newElement);
        anchor = newElement;
      }
    };
    subscribe(child, update);
    update();
    return anchor;
  }
  else if (child === null || child === undefined) {
    return [];
  }
  else {
    return createTextNode(String(child));
  }
};

export const childrenSetter = function (this: HTMLElement, ...children: ChildType[]): HTMLElement {
  const results = safeMap(
    children,
    childSetter
  );

  this.append(...results.flat());
  return this;
};