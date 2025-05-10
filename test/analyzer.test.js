import assert from "node:assert/strict";
import { describe, it } from "node:test";
import analyze from "../src/analyzer.js";
import parse from "../src/parser.js";

// Programs that are semantically correct
const semanticChecks = [
  ["variable declaration and print", "5al x = 5 ensa5(x)"],
  ["while loop with constant condition", "6alama(true): (ensa5(1))"],
  ["function with no return type", "dala foo(): (rd)"],
  ["function with return type", "dala bar() -> num: ( rd 5 )"],
  ["function that returns nothing", "dala void(): (rd)"],
  [
    "function with multiple statements",
    `
  dala foo() -> num: (
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
  [
    "function call with correct number of arguments",
    `
    dala greet(name: str): (
      ensa5(name)
    )
    greet("bob")
    `,
  ],
  [
    "function call with correct number of arguments",
    `
    dala greet(name: str, age: num): (
      ensa5(name)
      ensa5(age)
    )
    greet("bob", 30)
    `,
  ],
  [
    "array literal with consistent types",
    `
    5al x = [1, 2, 3]
    ensa5(x[0])
    `,
  ],
  [
    "nested array access",
    `
    5al x = [[1, 2], [3, 4]]
    ensa5(x[1][0])
    `,
  ],
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
  [
    "redeclaration of parameter inside function",
    `dala foo(x: num): (
      5al x = 1
      5al x = 2
    )`,
    /already declared/,
  ],
  [
    "missing return value in function that expects one",
    `dala f() -> num: (rd)`,
    /must return a num/,
  ],
  [
    "returning a value from a void function",
    `dala f(): (rd 1)`,
    /should not return/,
  ],
  [
    "function call with too few arguments",
    `
    dala greet(name: str, title: str): (
      ensa5(name)
    )
    greet("bob")
    `,
    /greet expects 2 arguments but got 1/,
  ],
  [
    "throws if void function returns value",
    `
    dala nope(): (
      rd 5
    )
    `,
    /Void function should not return a value/,
  ],
  [
    "throws if function missing required return",
    `
    dala nope() -> num: (
      ensa5("hi")
    )
    `,
    /Function must return a num/,
  ],
  [
    "function call with too few arguments",
    `
    dala greet(name: str, age: num): (
      ensa5(name)
      ensa5(age)
    )
    greet("bob")
    `,
    /greet expects 2 arguments but got 1/,
  ],
  [
    "throws if function missing required return",
    `
    dala add(x: num, y: num) -> num: (
      x = x + y
    )
    `,
    /Function must return a num/,
  ],
  [
    "call to undeclared function",
    `
    dala foo(): (rd)
    bar()
    `,
    /Function bar not declared/,
  ],
  [
    "duplicate function declaration",
    `
    dala foo(): (rd)
    dala foo(): (rd)
    `,
    /Function foo already declared/,
  ],
  [
    "array with inconsistent types",
    `
    5al x = [1, "two"]
    ensa5(x)
    `,
    /All elements in an array must have the same type/,
  ],
  [
    "subscript non-array",
    `
    5al x = 5
    ensa5(x[0])
    `,
    /Only arrays can be subscripted/,
  ],
  [
    "non-numeric subscript",
    `
    5al x = [1, 2, 3]
    ensa5(x["one"])
    `,
    /Array index must be a number/,
  ],
  [
    "array used as a function call",
    `
    5al x = [1, 2, 3]
    x(1)
    `,
    /Function x not declared/,
  ],
  [
    "string used as array index",
    `
    5al arr = [10, 20]
    ensa5(arr["first"])
    `,
    /Array index must be a number/,
  ],
  ["1 + true", /Type mismatch in binary expression: num \+ bool/],
  ['"hi" - 1', /Type mismatch in binary expression: str \- num/],
  ['1 * "two"', /Type mismatch in binary expression: num \* str/],
  ['1 / "two"', /Type mismatch in binary expression: num \/ str/],
  ['"a" % "b"', /Operator % requires numeric operands/],
  ['2 ** "hi"', /Type mismatch in exponentiation: num \*\* str/],
  ["true ** 3", /Exponentiation requires numeric operands/],
  ['1 == "1"', /Type mismatch in binary expression: num == str/],
  ['"hi" < 3', /Type mismatch in binary expression: str < num/],
  ["true > false", /Type mismatch in binary expression: bool > bool/],
  [
    "unary minus on boolean",
    "5al x = -true",
    /Unary '-' requires a numeric operand/,
  ],
  [
    "unary minus on string",
    '5al x = -"hi"',
    /Unary '-' requires a numeric operand/,
  ],
  [
    "logical not on number",
    "5al x = !42",
    /Unary '!' requires a boolean operand/,
  ],
  [
    "logical not on string",
    '5al x = !"hello"',
    /Unary '!' requires a boolean operand/,
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
