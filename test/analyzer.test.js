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
  )`,
  ],
  ["block-scoped variable access", "dala foo(): (5al x = 5 ensa5(x))"],
  [
    "variable shadowing in nested block",
    `
  5al x = 1
  (5al x = 2 ensa5(x))
  ensa5(x)`,
  ],
  ["variable used after declaration in same block", "5al y = 42 ensa5(y)"],
  [
    "function call with correct number of args",
    `
  dala greet(name: str): (
    ensa5(name)
  )
  greet("bob")`,
  ],
  [
    "function call with correct number of args (2 params)",
    `
  dala greet(name: str, age: num): (
    ensa5(name)
    ensa5(age)
  )
  greet("bob", 30)`,
  ],
  [
    "array literal with consistent types",
    `
  5al x = [1, 2, 3]
  ensa5(x[0])`,
  ],
  [
    "nested array access",
    `
  5al x = [[1, 2], [3, 4]]
  ensa5(x[1][0])`,
  ],
  ["number literal", "insa5(5)"],
  ["string literal", 'insa5("ok")'],
  ["boolean true literal", `insa5(true)`],
  ["boolean false literal", `insa5(false)`],
  ["array literal is allowed", `insa5([1, 2, 3])`],
  ["parenthesized expression", "insa5((1 + 2))"],
  ["valid exponentiation", "insa5(2 ** 3)"],
  ["comparison operator", "insa5(1 < 2)"],
  ["function with array parameter type", "dala foo(a: num[]): (rd)"],
  ["function with array parameter type", "dala foo(a: num[]): (rd)"],
  ["function with array param type", "dala foo(a: num[]): (insa5(a))"],
  ["literal array subscript", "insa5([1, 2, 3][1])"],
  [
    "valid equality comparison",
    `
    5al x = 1
    5al y = 2
    5al isSame = x == y
    insa5(isSame)
    `,
  ],
  [
    "valid string comparison",
    `
    5al s1 = "hi"
    5al s2 = "hello"
    5al isSame = s1 != s2
    insa5(isSame)
    `,
  ],
  [
    "valid function call with correct arg types",
    `
    dala greet(name: str, age: num): (
      ensa5(name)
      ensa5(age)
    )
    greet("bob", 30)
    `,
  ],
  [
    "array type in function parameter",
    `
    dala printAll(arr: num[]): (
      ensa5(arr[0])
    )
    printAll([1, 2, 3])
    `,
  ],
];

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
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
  ["empty array literal", `5al x = []`, /Empty arrays are not allowed/],
  [
    "mixed-type addition",
    '5al x = 1 + "a"',
    /Type mismatch in binary expression: num \+ str/,
  ],
  [
    "unary '-' on boolean",
    "5al x = -false",
    /Unary '-' requires a numeric operand/,
  ],
  [
    "unary '!' on number",
    "5al x = !42",
    /Unary '!' requires a boolean operand/,
  ],
  [
    "invalid exponentiation",
    "5al x = true ** 2",
    /Type mismatch in exponentiation: bool \*\* num/,
  ],
  ["empty array literal", "5al x = []", /Empty arrays are not allowed/],
  [
    "mixed array element types",
    "5al x = [1, true]",
    /All elements in an array must have the same type/,
  ],
  ["subscript on non-array", "5al x = 5[0]", /Only arrays can be subscripted/],
  [
    "non-numeric subscript index",
    "5al x = [1,2][false]",
    /Array index must be a number/,
  ],
  [
    "modulo on non-numeric",
    '5al x = "foo" % "bar"',
    /Operator % requires numeric operands/,
  ],
  ["assign to undeclared var", "x = 5", /x has not been declared/],
  ["return outside function", "rd 5", /Return statement not inside a function/],
  [
    "return type mismatch",
    `dala f() -> num: (
      rd "hello"
    )`,
    /Return type mismatch: expected num but got str/,
  ],
  [
    "string ** string",
    '5al x = "a" ** "b"',
    /Exponentiation requires numeric operands/,
  ],
  ["undeclared variable", "ensa5(x)", /x has not been declared/],
  ["assign to undeclared var", "x = 5", /x has not been declared/],
  ["return outside function", "rd 5", /Return statement not inside a function/],
  [
    "missing return in non‐void fn",
    "dala f() -> num: (rd)",
    /must return a num/,
  ],
  ["void function returns value", "dala f(): ( rd 1 )", /should not return/],
  [
    "duplicate declaration in block",
    "dala foo(): (5al x = 5  5al x = 10)",
    /already declared/,
  ],
  [
    "redeclaration of parameter",
    "dala foo(x: num): (5al x = 1 5al x = 2)",
    /already declared/,
  ],
  [
    "duplicate function declaration",
    "dala foo(): ( rd ) dala foo(): ( rd )",
    /already declared/,
  ],
  [
    "too few call args",
    "dala greet(a: num,b: num): (ensa5(a)ensa5(b)) greet(1)",
    /expects 2 arguments but got 1/,
  ],
  [
    "array with inconsistent types",
    '5al x = [1, "two"] ensa5(x)',
    /All elements in an array must have the same type/,
  ],
  [
    "subscript non-array",
    "5al x = 5 ensa5(x[0])",
    /Only arrays can be subscripted/,
  ],
  [
    "non-numeric subscript index",
    "5al x = [1,2] ensa5(x[true])",
    /Array index must be a number/,
  ],
  [
    "addition type mismatch",
    '5al x = 1 + "a"',
    /Type mismatch in binary expression: num \+ str/,
  ],
  [
    "subtraction type mismatch",
    '5al x = "hi" - 1',
    /Type mismatch in binary expression: str \- num/,
  ],
  [
    "multiplication type mismatch",
    '5al x = 1 * "two"',
    /Type mismatch in binary expression: num \* str/,
  ],
  [
    "division type mismatch",
    '5al x = 1 / "two"',
    /Type mismatch in binary expression: num \/ str/,
  ],
  [
    "modulo on non-numeric",
    '5al x = "a" % "b"',
    /Operator % requires numeric operands/,
  ],
  [
    "exponent type mismatch",
    '5al x = 2 ** "hi"',
    /Type mismatch in exponentiation: num \*\* str/,
  ],
  [
    "bool exponent mismatch",
    "5al x = true ** 2",
    /Type mismatch in exponentiation: bool \*\* num/,
  ],
  [
    "type mismatch in binary expression",
    `5al x = 1 + true`,
    /Type mismatch in binary expression: num \+ bool/,
  ],
  [
    "only arrays can be subscripted",
    `5al x = 5[0]`,
    /Only arrays can be subscripted/,
  ],
  [
    "array index must be a number",
    `5al x = [1,2][false]`,
    /Array index must be a number/,
  ],
  [
    "type mismatch in equality comparison",
    `
    5al x = 1
    5al s = "hello"
    5al bad = x == s
    `,
    /Type mismatch in binary expression: num == str/,
  ],
  [
    "type mismatch in boolean vs number",
    `
    5al x = true
    5al y = 1
    5al bad = x != y
    `,
    /Type mismatch in binary expression: bool != num/,
  ],
  [
    "call to undeclared function",
    `
    hello()
    `,
    /Function hello not declared/,
  ],
  [
    "function call with too many arguments",
    `
    dala shout(msg: str): (
      ensa5(msg)
    )
    shout("hi", "oops")
    `,
    /shout expects 1 arguments but got 2/,
  ],
  [
    "function call with type mismatch in argument",
    `
    dala say(times: num): (
      ensa5(times)
    )
    say("hello")
    `,
    /Argument 1 to say must be num but got str/,
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
