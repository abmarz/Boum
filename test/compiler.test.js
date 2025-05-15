import assert from "node:assert";
import { describe, it } from "node:test";
import compile from "../src/compiler.js";
import { Program } from "../src/core.js";

describe("The compiler", () => {
  it("is alive", () => {
    assert.equal(compile('ensa5("Hello")', "parsed"), "Syntax is ok");
  });
  it("throws for unknown outputType", () => {
    assert.throws(() => compile("whatever", "bogus"), /Unknown output type/);
  });

  it("returns an AST (Program) for analyzed", () => {
    const ast = compile("5al x = 1 ensa5(x)", "analyzed");
    assert.ok(ast instanceof Program);
    assert.ok(Array.isArray(ast.statements));
  });

  it("returns an optimized AST for optimized", () => {
    const optAst = compile("5al x = 1 ensa5(x)", "optimized");
    assert.ok(optAst instanceof Program);
    assert.ok(Array.isArray(optAst.statements));
  });

  it("returns generated JS source for js", () => {
    const js = compile("5al x = 1 insa5(x)", "js");
    assert.match(js, /let x_1 = 1;/);
    assert.match(js, /console\.log\(x_1\);/);
  });
});
