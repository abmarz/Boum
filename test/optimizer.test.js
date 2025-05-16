import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as core from "../src/core.js";
import optimize from "../src/optimizer.js";

const i = new core.Variable("x", true, core.intType);
const x = new core.Variable("x", true, core.floatType);
const a = new core.Variable("a", true, new core.ArrayType(core.intType));
const return1p1 = new core.ReturnStmt(
  new core.BinaryExp("+", 1, 1, core.intType)
);
const return2 = new core.ReturnStmt(2);
const returnX = new core.ReturnStmt(x);
const onePlusTwo = new core.BinaryExp("+", 1, 2, core.intType);
const aParam = new core.Variable("a", false, core.anyType);
const anyToAny = new core.Fun([core.anyType], core.anyType);
const identity = Object.assign(
  new core.Fun("id", [aParam], [returnX], anyToAny)
);
const voidInt = new core.Fun([], core.intType);
const callIdentity = (args) => new core.Call(identity, args);
const times = (x, y) => new core.BinaryExp("*", x, y);
const neg = (x) => new core.UnaryExp("-", x);
const array = (...elements) => new core.ArrayExp(elements);
const sub = (a, e) => new core.SubscriptExp(a, e);
const program = new core.Program();

const tests = [
  ["folds +", new core.BinaryExp("+", 5, 8), 13],
  ["folds -", new core.BinaryExp("-", 5n, 8n), -3n],
  ["folds *", new core.BinaryExp("*", 4, 5), 20],
  ["folds unary -", new core.UnaryExp("-", 7), -7],
  ["optimizes 0-", new core.BinaryExp("-", 0, x), neg(x)],
  ["optimizes in subscripts", sub(a, onePlusTwo), sub(a, 3)],
  ["optimizes in array literals", array(0, onePlusTwo, 9), array(0, 3, 9)],
  ["optimizes in arguments", callIdentity([times(3, 5)]), callIdentity([15])],
  ["folds /", new core.BinaryExp("/", 20, 4, core.intType), 5],
  [
    "folds nested in subscripts",
    sub(a, new core.BinaryExp("/", 8, 2, core.intType)),
    sub(a, 4),
  ],
  [
    "folds nested -(+)",
    new core.UnaryExp("-", new core.BinaryExp("+", 2, 3, core.intType)),
    -5,
  ],
  [
    "folds nested nullish",
    new core.BinaryExp(
      "??",
      new core.BinaryExp("??", null, null, core.anyType),
      7,
      core.anyType
    ),
    7,
  ],
  [
    "keeps non-constant +",
    new core.BinaryExp("+", i, 2, core.intType),
    new core.BinaryExp("+", i, 2, core.intType),
  ],
  [
    "optimizes in print stmt",
    new core.PrintStmt(new core.BinaryExp("+", 2, 3, core.intType)),
    new core.PrintStmt(5),
  ],
  [
    "optimizes in var decl",
    new core.VarDec(i, new core.BinaryExp("*", 6, 7, core.intType)),
    new core.VarDec(i, 42),
  ],
  [
    "optimizes in assign",
    new core.AssignStmt(x, new core.BinaryExp("-", 10n, 4n)),
    new core.AssignStmt(x, 6n),
  ],
  ["optimizes nested arrays", array(array(onePlusTwo)), array(array(3))],
  [
    "optimizes nested calls",
    callIdentity([callIdentity([times(2, 3)])]),
    callIdentity([callIdentity([6])]),
  ],
  ["folds strength literal", new core.BinaryExp("-", 0, 7, core.intType), -7],
  [
    "folds nullish undefined",
    new core.BinaryExp("??", undefined, 9, core.anyType),
    9,
  ],
  [
    "keeps nullish when left",
    new core.BinaryExp("??", false, 9, core.anyType),
    new core.BinaryExp("??", false, 9, core.anyType),
  ],
  [
    "optimizes in function decl",
    new core.FunDec(new core.Fun("f", [], core.intType), [
      new core.ReturnStmt(new core.BinaryExp("+", 2, 3, core.intType)),
    ]),
    new core.FunDec(new core.Fun("f", [], core.intType), [
      new core.ReturnStmt(5),
    ]),
  ],
  [
    "optimizes in program",
    new core.Program([
      new core.ReturnStmt(new core.BinaryExp("*", 3, 7, core.intType)),
    ]),
    new core.Program([new core.ReturnStmt(21)]),
  ],
  [
    "array literals unchanged",
    new core.ArrayExp([1, 2, 3]),
    new core.ArrayExp([1, 2, 3]),
  ],
  [
    "folds subscript index",
    new core.SubscriptExp(a, new core.BinaryExp("*", 2, 3, core.intType)),
    new core.SubscriptExp(a, 6),
  ],
  [
    "optimizes call subtraction",
    new core.Call(identity, [new core.BinaryExp("-", 10, 5, core.intType)]),
    new core.Call(identity, [5]),
  ],
  [
    "folds division non-int",
    new core.BinaryExp("/", 5, 2, core.floatType),
    2.5,
  ],
  [
    "folds nested strength",
    new core.BinaryExp(
      "-",
      0,
      new core.BinaryExp("+", 4, 1, core.intType),
      core.intType
    ),
    -5,
  ],
  ["folds BigInt *", new core.BinaryExp("*", 6n, 7n, core.intType), 42n],
  ["folds BigInt /", new core.BinaryExp("/", 10n, 2n, core.intType), 5n],
  [
    "folds nested binary in call",
    callIdentity([
      new core.BinaryExp(
        "+",
        1,
        new core.BinaryExp("+", 2, 3, core.intType),
        core.intType
      ),
    ]),
    callIdentity([6]),
  ],
  ["folds nested unary", new core.UnaryExp("-", new core.UnaryExp("-", 4)), 4],
  [
    "folds nullish in subscript",
    sub(a, new core.BinaryExp("??", null, 5, core.anyType)),
    sub(a, 5),
  ],
  [
    "folds nullish in assign",
    new core.AssignStmt(x, new core.BinaryExp("??", null, 9, core.anyType)),
    new core.AssignStmt(x, 9),
  ],
  [
    "folds nested nullish var",
    new core.VarDec(
      i,
      new core.BinaryExp(
        "??",
        new core.BinaryExp("??", null, null, core.anyType),
        "value",
        core.anyType
      )
    ),
    new core.VarDec(i, "value"),
  ],
  [
    "keeps % operator",
    new core.BinaryExp("%", 5, 2, core.intType),
    new core.BinaryExp("%", 5, 2, core.intType),
  ],
  [
    "optimizes in while",
    new core.WhileStmt(new core.BinaryExp("-", 10, 5, core.intType), [
      new core.PrintStmt(new core.BinaryExp("*", 2, 3, core.intType)),
    ]),
    new core.WhileStmt(5, [new core.PrintStmt(6)]),
  ],
  [
    "optimizes nested while in function",
    new core.FunDec(new core.Fun("f", [], core.anyType), [
      new core.WhileStmt(
        new core.BinaryExp(
          "??",
          null,
          new core.BinaryExp("+", 2, 3, core.intType)
        ),
        [new core.ReturnStmt(new core.BinaryExp("-", 5, 2, core.intType))]
      ),
    ]),
    new core.FunDec(new core.Fun("f", [], core.anyType), [
      new core.WhileStmt(5, [new core.ReturnStmt(3)]),
    ]),
  ],
  [
    "optimizes division in print stmt",
    new core.PrintStmt(new core.BinaryExp("/", 9, 3, core.intType)),
    new core.PrintStmt(3),
  ],
  [
    "folds deep nested arrays",
    new core.ArrayExp([
      new core.ArrayExp([
        new core.ArrayExp([new core.BinaryExp("+", 1, 2, core.intType)]),
      ]),
    ]),
    new core.ArrayExp([new core.ArrayExp([new core.ArrayExp([3])])]),
  ],
  [
    "folds deep nested calls",
    callIdentity([
      callIdentity([
        callIdentity([new core.BinaryExp("*", 2, 3, core.intType)]),
      ]),
    ]),
    callIdentity([callIdentity([callIdentity([6])])]),
  ],
  ["keeps call non-const arg", callIdentity([i]), callIdentity([i])],
  [
    "optimizes subscript in array",
    new core.SubscriptExp(
      new core.ArrayExp([new core.BinaryExp("+", 1, 2, core.intType), 3]),
      0
    ),
    new core.SubscriptExp(new core.ArrayExp([3, 3]), 0),
  ],
  [
    "folds (1+2)*(3+4)",
    new core.BinaryExp(
      "*",
      new core.BinaryExp("+", 1, 2, core.intType),
      new core.BinaryExp("+", 3, 4, core.intType)
    ),
    21,
  ],
  [
    "folds chained +",
    new core.BinaryExp(
      "+",
      new core.BinaryExp("+", 1, 2, core.intType),
      3,
      core.intType
    ),
    6,
  ],
  [
    "folds division by zero",
    new core.BinaryExp("/", 1, 0, core.floatType),
    Infinity,
  ],
];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});

// In the spirit of academic honesty this is built off of How to write a compiler (cs.lmu.edu/~ray)
