import assert from "node:assert/strict";
import { describe, it } from "node:test";
import analyze from "../src/analyzer.js";
import { PrintStmt, Program, Variable } from "../src/core.js";
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
  {
    name: "number",
    source: dedent`insa5(42)`,
    expected: dedent`console.log(42);`,
  },
  {
    name: "string",
    source: dedent`insa5("hi")`,
    expected: dedent`console.log("hi");`,
  },
  {
    name: "boolean true",
    source: dedent`insa5(true)`,
    expected: dedent`console.log(true);`,
  },
  {
    name: "boolean false",
    source: dedent`insa5(false)`,
    expected: dedent`console.log(false);`,
  },
  {
    name: "parentheses",
    source: dedent`insa5((1 + 2))`,
    expected: dedent`console.log(1 + 2);`,
  },
  {
    name: "exponent operator",
    source: dedent`insa5(2 ** 3)`,
    expected: dedent`console.log(2 ** 3);`,
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

  it("throws on unrecognized expression node", () => {
    const badPrint = new PrintStmt({ foo: "bar" });
    const badProg = new Program([badPrint]);
    assert.throws(() => generate(badProg), /Unrecognized expression node/);
  });

  it("throws on unrecognized statement node", () => {
    const badProg = new Program([{}]);
    assert.throws(() => generate(badProg), /Unrecognized statement node/);
  });
  it("generates null literal", () => {
    const prog = new Program([new PrintStmt(null)]);
    const js = generate(prog);
    assert.strictEqual(dedent(js), "console.log(null);");
  });

  it("generates undefined literal", () => {
    const prog = new Program([new PrintStmt(undefined)]);
    const js = generate(prog);
    assert.strictEqual(dedent(js), "console.log(undefined);");
  });
  it("falls back to original name when not renamed", () => {
    const ast = new Program([new PrintStmt(new Variable("notRenamed", null))]);
    const js = generate(ast);
    assert.match(js, /console\.log\(notRenamed\)/);
  });
  it("generates function call", () => {
    const ast = parse(`
      dala greet(name: str): (
        insa5(name)
      )
      greet("Bob")
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /greet\("Bob"\);/);
  });
  it("generates function declaration with return", () => {
    const ast = parse(`
      dala add(x: num, y: num) -> num: (
        rd x + y
      )
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /function add\(x, y\)/);
    assert.match(js, /return x \+ y;/);
  });
  it("generates return statement", () => {
    const ast = parse(`
      dala ten() -> num: (
        rd 10
      )
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /return 10;/);
  });
  it("generates array literal", () => {
    const ast = parse(`
      5al nums = [1, 2, 3]
      insa5(nums)
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /let nums_1 = \[1, 2, 3\];/);
  });
  it("generates array subscript", () => {
    const ast = parse(`
      5al nums = [4, 5]
      insa5(nums[0])
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /console\.log\(nums_1\[0\]\);/);
  });
  it("generates while loop", () => {
    const ast = parse(`
      5al i = 0
      6alama(i < 3): (
        insa5(i)
        i = i + 1
      )
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /while \(i_1 < 3\)/);
    assert.match(js, /console\.log\(i_1\);/);
    assert.match(js, /i_1 = i_1 \+ 1;/);
  });
  it("generates function call as part of an expression", () => {
    const ast = parse(`
      dala double(x: num) -> num: (
        rd x * 2
      )
      5al result = double(4)
      insa5(result)
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /let result_1 = double\(4\);/);
    assert.match(js, /console\.log\(result_1\);/);
  });
  it("generates block that returns an array of statements", () => {
    const ast = parse(`
      5al x = 0
      6alama(x < 2): (
        insa5(x)
        x = x + 1
      )
    `);
    const js = generate(optimize(analyze(ast)));
    assert.match(js, /while \(x_1 < 2\)/);
    assert.match(js, /console\.log\(x_1\);/);
    assert.match(js, /x_1 = x_1 \+ 1;/);
  });
});
