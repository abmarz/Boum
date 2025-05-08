import * as fs from "node:fs";
import * as ohm from "ohm-js";
import * as core from "../src/core.js";

// Load the grammar
const grammar = ohm.grammar(fs.readFileSync("src/boum.ohm"));

// Write out Analyzer
export default function analyze(match) {
  const scopes = [new Map()]; // top is current scoope
  function declare(name) {
    const current = scopes[scopes.length - 1];
    if (current.has(name)) {
      throw new Error(`${name} already declared in this scope`);
    }
    current.set(name, true);
  }

  function isDeclared(name) {
    return scopes.some((scope) => scope.has(name));
  }
  const semantics = match.matcher.grammar
    .createSemantics()
    .addOperation("rep", {
      Program(statements) {
        return new core.Program(statements.children.map((s) => s.rep()));
      },

      VarDec(_let, id, _eq, exp) {
        const name = id.sourceString;
        declare(name);
        return new core.VarDec(new core.Variable(name, null), exp.rep());
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

      Exp_binary(left, op, right) {
        return new core.BinaryExp(
          op.sourceString,
          left.rep(),
          right.rep(),
          null
        );
      },

      Term_binary(left, op, right) {
        return new core.BinaryExp(
          op.sourceString,
          left.rep(),
          right.rep(),
          null
        );
      },

      Factor_binary(left, _op, right) {
        return new core.BinaryExp("**", left.rep(), right.rep(), null);
      },

      Factor_unary(op, expr) {
        return new core.UnaryExp(op.sourceString, expr.rep(), null);
      },

      Var_id(id) {
        const name = id.sourceString;
        if (!isDeclared(name)) {
          throw new Error(`${name} has not been declared`);
        }
        return new core.Variable(name, null);
      },

      num(_int, _dot, _frac, _e, _sign, _exp) {
        return Number(this.sourceString);
      },

      strlit(_open, chars, _close) {
        return this.sourceString.slice(1, -1);
      },

      true(_) {
        return true;
      },

      false(_) {
        return false;
      },

      Primary_true(_token) {
        return true;
      },

      Primary_false(fl) {
        return fl.rep();
      },

      Primary_paren(_open, exp, _close) {
        return exp.rep();
      },

      _terminal() {
        return this.sourceString;
      },

      FunDec(_fun, id, params, returnTypeOpt, _colon, block) {
        const name = id.sourceString;
        const paramList = params.rep();
        const retType =
          returnTypeOpt.children.length === 0
            ? new core.BasicType("void")
            : returnTypeOpt.children[0].rep();
        const fun = new core.Fun(name, paramList, retType);
        return new core.FunDec(fun, block.rep());
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

      Type(id) {
        return new core.BasicType(id.sourceString);
      },

      ReturnStmt(_ret, expOpt) {
        if (expOpt.children.length === 0) {
          return new core.ReturnStmt(null);
        }
        return new core.ReturnStmt(expOpt.children[0].rep());
      },

      ReturnType(_arrow, type) {
        return type.rep();
      },

      Condition_binary(left, op, right) {
        return new core.BinaryExp(
          op.sourceString,
          left.rep(),
          right.rep(),
          null
        );
      },

      Exp_binary(left, op, right) {
        return new core.BinaryExp(
          op.sourceString,
          left.rep(),
          right.rep(),
          null
        );
      },

      Term_binary(left, op, right) {
        return new core.BinaryExp(
          op.sourceString,
          left.rep(),
          right.rep(),
          null
        );
      },

      Factor_binary(left, _op, right) {
        return new core.BinaryExp("**", left.rep(), right.rep(), null);
      },

      Factor_unary(op, expr) {
        return new core.UnaryExp(op.sourceString, expr.rep(), null);
      },
    });

  return semantics(match).rep();
}
