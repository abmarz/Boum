import * as fs from "node:fs";
import * as ohm from "ohm-js";
import * as core from "../src/core.js";

// Load the grammar
const grammar = ohm.grammar(fs.readFileSync("src/boum.ohm"));

// Write out Analyzer
export default function analyze(match) {
  const scopes = [new Map()];
  const expectedReturnTypes = [];
  const functions = new Map();
  let currentFunctionReturnType = null;
  const returnTypes = [];

  function declare(name, type = new core.BasicType("any")) {
    const current = scopes[scopes.length - 1];
    const map = current.vars ?? current;
    if (map.has(name) && scopes.length > 2) {
      throw new Error(`${name} already declared in this scope`);
    }
    const variable = new core.Variable(name, type);
    map.set(name, variable);
    return variable;
  }

  function isDeclared(name) {
    return scopes.some((scope) => (scope.vars ?? scope).has(name));
  }
  function findVariable(name) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const scope = scopes[i];
      const vars = scope.vars ?? scope;
      if (vars.has(name)) {
        return vars.get(name);
      }
    }
    return null;
  }

  const semantics = match.matcher.grammar
    .createSemantics()
    .addOperation("rep", {
      Program(statements) {
        return new core.Program(statements.children.map((s) => s.rep()));
      },

      VarDec(_let, id, _eq, exp) {
        const name = id.sourceString;
        const expr = exp.rep();
        declare(name, expr.type);
        return new core.VarDec(new core.Variable(name, expr.type), expr);
      },

      PrintStmt(_print, _open, exp, _close) {
        return new core.PrintStmt(exp.rep());
      },

      AssignStmt(id, _eq, exp) {
        const name = id.sourceString;
        if (!isDeclared(name)) {
          throw new Error(`${name} has not been declared`);
        }
        return new core.AssignStmt(new core.Variable(name, null), exp.rep());
      },

      Block(_open, stmts, _close) {
        scopes.push(new Map()); // eter new scope
        const body = stmts.children.map((s) => s.rep());
        scopes.pop(); // exit scope
        return body;
      },

      WhileStmt(_while, test, _colon, block) {
        return new core.WhileStmt(test.rep(), block.rep());
      },

      Var_id(id) {
        const name = id.sourceString;
        const variable = findVariable(name);
        if (!variable) {
          throw new Error(`${name} has not been declared`);
        }
        return variable;
      },

      num(_int, _dot, _frac, _e, _sign, _exp) {
        const value = Number(this.sourceString);
        return Object.assign(value, { type: new core.BasicType("num") });
      },

      strlit(_open, chars, _close) {
        const value = this.sourceString.slice(1, -1);
        return Object.assign(value, { type: new core.BasicType("str") });
      },

      Primary_true(_token) {
        return Object.assign(true, { type: new core.BasicType("bool") });
      },
      Primary_false(_token) {
        return Object.assign(false, { type: new core.BasicType("bool") });
      },

      Primary_paren(_open, exp, _close) {
        return exp.rep();
      },

      FunDec(_fun, id, params, returnTypeOpt, _colon, block) {
        const name = id.sourceString;
        if (functions.has(name)) {
          throw new Error(`Function ${name} already declared`);
        }

        const paramList = params.rep();
        const retType =
          returnTypeOpt.children.length === 0
            ? new core.BasicType("void")
            : returnTypeOpt.children[0].rep();

        const fun = new core.Fun(name, paramList, retType);
        functions.set(name, fun);
        scopes.push({ function: fun, vars: new Map() });
        for (const param of paramList) {
          declare(param.name, param.type);
        }
        expectedReturnTypes.push(fun.returnType);
        let returnFound = false;
        const previousFunctionReturnType = currentFunctionReturnType;
        currentFunctionReturnType = retType;
        returnTypes.push(retType);
        const body = block.rep();
        returnTypes.pop();
        currentFunctionReturnType = previousFunctionReturnType;
        for (const stmt of body) {
          if (stmt instanceof core.ReturnStmt) {
            returnFound = true;
            break;
          }
        }
        expectedReturnTypes.pop();
        scopes.pop();
        if (fun.returnType.name !== "void" && !returnFound) {
          throw new Error(`Function must return a ${fun.returnType.name}`);
        }
        return new core.FunDec(fun, body);
      },

      Params(_open, paramList, _close) {
        return paramList.asIteration().children.map((p) => p.rep());
      },

      Param(id, _colon, type) {
        return new core.Variable(id.sourceString, type.rep());
      },

      Type_array(inner, _brackets) {
        return new core.ArrayType(inner.rep());
      },

      Type_id(id) {
        return new core.BasicType(id.sourceString);
      },

      ReturnStmt(_ret, expOpt) {
        if (returnTypes.length === 0) {
          throw new Error("Return statement not inside a function");
        }

        const retType = returnTypes[returnTypes.length - 1];

        if (expOpt.children.length === 0) {
          if (retType.name !== "void") {
            throw new Error(`Function must return a ${retType.name}`);
          }
          return new core.ReturnStmt(null);
        }

        const expr = expOpt.children[0].rep();

        if (retType.name === "void") {
          throw new Error("Void function should not return a value");
        }

        if (expr.type?.name && expr.type.name !== retType.name) {
          throw new Error(
            `Return type mismatch: expected ${retType.name} but got ${expr.type.name}`
          );
        }

        return new core.ReturnStmt(expr);
      },

      ReturnType(_arrow, type) {
        return type.rep();
      },

      Exp_binary(left, op, right) {
        const leftRep = left.rep();
        const rightRep = right.rep();
        const opStr = op.sourceString;

        const leftType = leftRep.type?.name;
        const rightType = rightRep.type?.name;

        if (leftType !== rightType) {
          throw new Error(
            `Type mismatch in binary expression: ${leftType} ${opStr} ${rightType}`
          );
        }

        const result = new core.BinaryExp(opStr, leftRep, rightRep, null);
        result.type = new core.BasicType("bool");
        return result;
      },

      Condition_binary(left, op, right) {
        const leftRep = left.rep();
        const rightRep = right.rep();
        const opStr = op.sourceString;

        const leftType = leftRep.type?.name;
        const rightType = rightRep.type?.name;

        if (leftType !== rightType) {
          throw new Error(
            `Type mismatch in binary expression: ${leftType} ${opStr} ${rightType}`
          );
        }

        const result = new core.BinaryExp(opStr, leftRep, rightRep, null);
        result.type = new core.BasicType("num");
        return result;
      },

      Term_binary(left, op, right) {
        const leftRep = left.rep();
        const rightRep = right.rep();
        const opStr = op.sourceString;

        const leftType = leftRep.type?.name;
        const rightType = rightRep.type?.name;

        if (leftType !== rightType) {
          throw new Error(
            `Type mismatch in binary expression: ${leftType} ${opStr} ${rightType}`
          );
        }

        if (leftType !== "num") {
          throw new Error(
            `Operator ${opStr} requires numeric operands, got ${leftType}`
          );
        }

        const result = new core.BinaryExp(opStr, leftRep, rightRep, null);
        result.type = new core.BasicType("num");
        return result;
      },

      Factor_binary(left, _op, right) {
        const leftRep = left.rep();
        const rightRep = right.rep();

        const leftType = leftRep.type?.name;
        const rightType = rightRep.type?.name;

        if (leftType !== rightType) {
          throw new Error(
            `Type mismatch in exponentiation: ${leftType} ** ${rightType}`
          );
        }

        if (leftType !== "num") {
          throw new Error("Exponentiation requires numeric operands");
        }

        const result = new core.BinaryExp("**", leftRep, rightRep, null);
        result.type = new core.BasicType("num");
        return result;
      },

      Factor_unary(opNode, exprNode) {
        const operand = exprNode.rep();
        if (opNode.sourceString === "-" && operand.type?.name !== "num") {
          throw new Error("Unary '-' requires a numeric operand");
        }
        if (opNode.sourceString === "!" && operand.type?.name !== "bool") {
          throw new Error("Unary '!' requires a boolean operand");
        }
        const resultType =
          opNode.sourceString === "-"
            ? operand.type
            : new core.BasicType("bool");

        return new core.UnaryExp(opNode.sourceString, operand, resultType);
      },

      Call(id, _open, args, _close) {
        const name = id.sourceString;
        if (!functions.has(name)) {
          throw new Error(`Function ${name} not declared`);
        }
        const fun = functions.get(name);
        const actualArgs = args.asIteration().children.map((arg) => arg.rep());

        if (actualArgs.length !== fun.params.length) {
          throw new Error(
            `${name} expects ${fun.params.length} arguments but got ${actualArgs.length}`
          );
        }

        for (let i = 0; i < actualArgs.length; i++) {
          const expected = fun.params[i].type?.name;
          const actual = actualArgs[i].type?.name;
          if (expected && actual && expected !== actual) {
            throw new Error(
              `Argument ${
                i + 1
              } to ${name} must be ${expected} but got ${actual}`
            );
          }
        }

        return new core.Call(name, actualArgs);
      },

      ArrayLiteral(_open, elements, _close) {
        const values = elements.asIteration().children.map((e) => e.rep());

        if (values.length === 0) {
          throw new Error("Empty arrays are not allowed");
        }

        const elementType = values[0].type?.name;
        for (const v of values) {
          if (v.type?.name !== elementType) {
            throw new Error("All elements in an array must have the same type");
          }
        }

        const array = new core.ArrayExp(values);
        array.type = new core.ArrayType(values[0].type);
        return array;
      },

      Primary_subscript(arrayExpr, _open, indexExpr, _close) {
        const array = arrayExpr.rep();
        const index = indexExpr.rep();

        if (!array.type || !(array.type instanceof core.ArrayType)) {
          throw new Error("Only arrays can be subscripted");
        }

        if (index.type?.name !== "num") {
          throw new Error("Array index must be a number");
        }

        return Object.assign(new core.SubscriptExp(array, index), {
          type: array.type.baseType,
        });
      },

      Var_subscript(base, _open, subscript, _close) {
        const array = base.rep();
        const index = subscript.rep();

        if (!array.type || array.type.constructor.name !== "ArrayType") {
          throw new Error("Only arrays can be subscripted");
        }

        if (!index.type || index.type.name !== "num") {
          throw new Error("Array index must be a number");
        }

        const result = new core.SubscriptExp(array, index);
        result.type = array.type.baseType;
        return result;
      },
    });

  return semantics(match).rep();
}

// In the spirit of academic honesty this is built off of How to write a compiler (cs.lmu.edu/~ray), and some AI tools such as copilot were used for troubleshooting and amplifying.
