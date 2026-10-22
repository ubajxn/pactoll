import { Window } from "happy-dom";
import type { ReactNode } from "react";

const testWindow = new Window({ url: "http://localhost/" });
const mountedRoots = new Set<{ unmount(): void }>();
testWindow.requestAnimationFrame = ((callback: (timestamp: number) => void) =>
  setTimeout(
    () => callback(performance.now()),
    0,
  )) as unknown as typeof testWindow.requestAnimationFrame;
testWindow.cancelAnimationFrame = ((handle: ReturnType<typeof setTimeout>) =>
  clearTimeout(handle)) as unknown as typeof testWindow.cancelAnimationFrame;

for (const name of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "Element",
  "Node",
  "Event",
  "FormData",
  "InputEvent",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "FocusEvent",
  "MutationObserver",
  "ResizeObserver",
  "IntersectionObserver",
] as const) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: testWindow[name],
  });
}

Object.defineProperty(globalThis, "getComputedStyle", {
  configurable: true,
  value: testWindow.getComputedStyle.bind(testWindow),
});
Object.defineProperty(globalThis, "requestAnimationFrame", {
  configurable: true,
  value: testWindow.requestAnimationFrame.bind(testWindow),
});
Object.defineProperty(globalThis, "cancelAnimationFrame", {
  configurable: true,
  value: testWindow.cancelAnimationFrame.bind(testWindow),
});
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
});

export async function mount(children: ReactNode) {
  const [{ act }, { createRoot }] = await Promise.all([
    import("react"),
    import("react-dom/client"),
  ]);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.add(root);
  await act(async () => {
    root.render(children);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return {
    container,
    async rerender(next: ReactNode) {
      await act(async () => {
        root.render(next);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    },
    async unmount() {
      await act(async () => root.unmount());
      mountedRoots.delete(root);
      container.remove();
      document.body.replaceChildren();
    },
  };
}

export async function cleanupDom() {
  const { act } = await import("react");
  await act(async () => {
    for (const root of mountedRoots) root.unmount();
  });
  mountedRoots.clear();
  document.body.replaceChildren();
}

export async function flush() {
  const { act } = await import("react");
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

export async function settle(action: () => void) {
  const { act } = await import("react");
  await act(async () => {
    action();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

export async function waitFor(check: () => boolean, message: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    await flush();
    if (check()) return;
  }
  throw new Error(message);
}

export async function changeValue(
  control: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const { act } = await import("react");
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(control),
      "value",
    )?.set;
    setter?.call(control, value);
    control.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
}

export async function dispatchKey(control: HTMLElement, key: string) {
  const { act } = await import("react");
  let event!: KeyboardEvent;
  await act(async () => {
    event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
    });
    control.dispatchEvent(event);
  });
  return event;
}

export async function blur(control: HTMLElement) {
  const { act } = await import("react");
  await act(async () => control.blur());
}

export async function click(control: HTMLElement) {
  const { act } = await import("react");
  await act(async () => {
    if (control.closest('[role="option"]'))
      control.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          pointerId: 1,
          pointerType: "mouse",
        }),
      );
    control.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        detail: 1,
      }),
    );
  });
}

export async function mouseDown(control: HTMLElement) {
  const { act } = await import("react");
  await act(async () => {
    control.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );
    control.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
      }),
    );
  });
  await flush();
}

export function byText(text: string) {
  return Array.from(document.querySelectorAll<HTMLElement>("*")).find(
    (element) =>
      element.children.length === 0 && element.textContent?.trim() === text,
  );
}

export type Deferred<T> = {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
};

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
