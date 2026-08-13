import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Testing Library only auto-cleans when vitest runs with `globals: true`. This
 * project imports its test helpers explicitly, so cleanup is registered here —
 * without it each render is appended to the same document and later tests see
 * markup from earlier ones.
 */
afterEach(cleanup);

/**
 * jsdom implements neither the Pointer Capture API nor scrollIntoView, both of
 * which Radix's Select and Dropdown call while opening. Without these stubs any
 * test that opens a menu dies on "hasPointerCapture is not a function".
 */
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

/**
 * Radix's Slider measures its track with a ResizeObserver, which jsdom does not
 * implement either. Without this, rendering a slider throws and the whole page
 * under test comes back empty.
 */
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
