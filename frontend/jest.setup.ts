import "@testing-library/jest-dom";
import { runInThisContext } from "vm";

// jsdom's jest environment shadows Node's built-in Web APIs on globalThis.
// Restore them from the underlying V8 global context so fetch-based tests work.
Object.assign(globalThis, runInThisContext("({ fetch, Response, Headers, Request })"));
