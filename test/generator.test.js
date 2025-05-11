import assert from "node:assert/strict";
import { describe, it } from "node:test";
import analyze from "../src/analyzer.js";
import generate from "../src/generator.js";
import optimize from "../src/optimizer.js";
import parse from "../src/parser.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)[ \t]+/g, "").trim();
}

const fixtures = [
  {
    name: "small",
    source: `
      5al x = 3 * 7
      x = x + 1
      insa5(x)
    `,
    expected: dedent`
      let x_1 = 3 * 7;
      x_1 = x_1 + 1;
      console.log(x_1);
    `,
  },
  {
    name: "unary literal",
    source: `5al x = -5`,
    expected: dedent`
      let x_1 = -5;
    `,
  },
  {
    name: "nested unary-binary",
    source: `5al x = -(2 + 3)`,
    expected: dedent`
      let x_1 = -(2 + 3);
    `,
  },
  {
    name: "multiple var declarations",
    source: dedent`
      5al x = 1
      5al y = x + 2
      insa5(y)
    `,
    expected: dedent`
      let x_1 = 1;
      let y_1 = x_1 + 2;
      console.log(y_1);
    `,
  },
  {
    name: "reuse same var name",
    source: dedent`
      5al a = 10
      5al a = a + 1
      insa5(a)
    `,
    expected: dedent`
      let a_1 = 10;
      let a_2 = a_2 + 1;
      console.log(a_2);
    `,
  },
  {
    name: "assignment mapping",
    source: dedent`
      5al x = 5
      x = x * 2
      insa5(x)
    `,
    expected: dedent`
      let x_1 = 5;
      x_1 = x_1 * 2;
      console.log(x_1);
    `,
  },
  {
    name: "string literal",
    source: dedent`
      5al s = "hello"
      insa5(s)
    `,
    expected: dedent`
      let s_1 = "hello";
      console.log(s_1);
    `,
  },
  {
    name: "boolean literal",
    source: dedent`
      5al b = true
      insa5(b)
    `,
    expected: dedent`
      let b_1 = true;
      console.log(b_1);
    `,
  },
  {
    name: "multiple prints",
    source: dedent`
      insa5(1)
      insa5(2 + 3)
    `,
    expected: dedent`
      console.log(1);
      console.log(2 + 3);
    `,
  },
  {
    name: "embedded unary in binary",
    source: dedent`
      5al x = 4 + -3
      insa5(x)
    `,
    expected: dedent`
      let x_1 = 4 + -3;
      console.log(x_1);
    `,
  },
  {
    name: "double unary negation",
    source: dedent`
      5al y = - -2
      insa5(y)
    `,
    expected: dedent`
      let y_1 = - -2;
      console.log(y_1);
    `,
  },
  {
    name: "print variable",
    source: dedent`
      5al x = 5
      insa5(x)
    `,
    expected: dedent`
      let x_1 = 5;
      console.log(x_1);
    `,
  },
  {
    name: "multiple dependencies",
    source: dedent`
      5al a = 1
      5al b = a + 2
      5al c = b * a
      insa5(c)
    `,
    expected: dedent`
      let a_1 = 1;
      let b_1 = a_1 + 2;
      let c_1 = b_1 * a_1;
      console.log(c_1);
    `,
  },
  {
    name: "chained addition",
    source: dedent`
      5al x = (1 + 2) + 3
      insa5(x)
    `,
    expected: dedent`
      let x_1 = 1 + 2 + 3;
      console.log(x_1);
    `,
  },
  {
    name: "boolean negation",
    source: dedent`
      5al b = !false
      insa5(b)
    `,
    expected: dedent`
      let b_1 = !false;
      console.log(b_1);
    `,
  },
  {
    name: "print negated literal",
    source: `insa5(-5)`,
    expected: `console.log(-5);`,
  },
  {
    name: "triple negation",
    source: dedent`
      5al x = - - -3
      insa5(x)
    `,
    expected: dedent`
      let x_1 = - - -3;
      console.log(x_1);
    `,
  },
  {
    name: "float addition",
    source: dedent`
      5al f = 2.5 + 3.1
      insa5(f)
    `,
    expected: dedent`
      let f_1 = 2.5 + 3.1;
      console.log(f_1);
    `,
  },
  {
    name: "exponent operator",
    source: dedent`
      5al x = 2 ** 3
      insa5(x)
    `,
    expected: dedent`
      let x_1 = 2 ** 3;
      console.log(x_1);
    `,
  },
  {
    name: "parenthesized literal",
    source: dedent`
      5al p = ((42))
      insa5(p)
    `,
    expected: dedent`
      let p_1 = 42;
      console.log(p_1);
    `,
  },
  {
    name: "string concatenation",
    source: dedent`
      5al s = "foo" + "bar"
      insa5(s)
    `,
    expected: dedent`
      let s_1 = "foo" + "bar";
      console.log(s_1);
    `,
  },
];

describe("The generator", () => {
  for (const { name, source, expected } of fixtures) {
    it(`produces expected js output for ${name}`, () => {
      const ast = parse(source);
      const analyzed = analyze(ast);
      const optimized = optimize(analyzed);
      const js = generate(optimized);
      assert.strictEqual(dedent(js), expected);
    });
  }
});
