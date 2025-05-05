import assert from "node:assert";
import { describe, it } from "node:test";
import compile from "../src/compiler.js";

describe("The compiler", () => {
  it("is alive", () => {
    assert.equal(compile('ensa5("Hello")', "parsed"), "Syntax is ok");
  });
});
