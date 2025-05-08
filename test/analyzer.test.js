import assert from "node:assert/strict";
import { describe, it } from "node:test";
import analyze from "../src/analyzer.js";
import parse from "../src/parser.js";

// Programs that are semantically correct
const semanticChecks = [
  ["variable declaration and print", "5al x = 5 \n ensa5(x)"],
  ["while loop with constant condition", "6alama(true): (rd 1)"],
  ["function with no return type", "dala foo(): (rd 5)"],
  ["function with return type", "dala bar() -> num: (rd 5)"],
  ["function that returns nothing", "dala void(): (rd)"],
  [
    "function with multiple statements",
    `
  dala foo(): (
    5al x = 5
    ensa5(x)
    rd x
  )`,
  ],
  [
    "while with multiple statements",
    `
  5al x = 0
  6alama(x < 3): (
    x = x + 1
    ensa5(x)
  )
  `,
  ],
  ["block-scoped variable access", `dala foo(): (5al x = 5 ensa5(x))`],
  [
    "variable shadowing in nested block",
    `
  5al x = 1
  (5al x = 2 ensa5(x))
  ensa5(x)
  `,
  ],
  ["variable used after declaration in same block", `5al y = 42 ensa5(y)`],
];

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["undeclared variable", "ensa5(x)", /x has not been declared/],
  [
    "undeclared condition in while",
    "6alama(x): (rd x)",
    /x has not been declared/,
  ],
  [
    "undeclared return variable",
    "dala foo(): (rd x)",
    /x has not been declared/,
  ],
  [
    "use of undeclared variable in block",
    `dala foo(): (ensa5(x))`,
    /x has not been declared/,
  ],
  [
    "duplicate declaration in same block",
    `dala foo(): (5al x = 5 5al x = 10)`,
    /x already declared/,
  ],
  [
    "variable declared in block not visible after",
    `(5al x = 1) ensa5(x)`,
    /x has not been declared/,
  ],
];

// Test the analyzer
describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
});
