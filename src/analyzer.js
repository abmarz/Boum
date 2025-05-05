import * as core from "../src/core.js";

export default function analyzer(match) {
  const analyzer = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(stmts) {
      return new core.Program([stmts.children.map((s) => s.rep())]);
    },
    PrintStmt(_print, _open, exp, _close) {
      return new core.PrintStmt(exp.rep());
    },

    AssignStmt(variable, _eq, exp) {
      const target = variable.rep();
      const source = exp.rep();
      return new core.AssignStmt(target, source);
    },

    VarDec(_let, id, _eq, exp) {
      const variable = id.sourceString;
      const initializer = exp.rep();
      return new core.VarDec(variable, initializer);
    },

    WhileStmt(_while, exp, _semi) {
      const test = exp.rep();
      return new core.WhileStmt(test); // might need to add a body
    },

    FunDec(_fun, id, params, type, colon) {
      // here
      const name = id.sourceString;
      const returnType = type.rep();
      const parameters = params.children.map((p) => p.rep());
      return new core.FunDec(name, parameters, returnType);
    },

    // should I do returnType from my ohm? if so it would be ReturnType(_arrow, type)
    ReturnStmt(_return, exps) {
      const expression = exps.rep();
      return new core.ReturnStmt(expression);
    },

    Params(_open, params, _close) {
      const parameters = params.children.map((p) => p.rep());
      return new core.Fun(parameters);
    },

    Param(id, _colon, type) {
      const name = id.sourceString;
      const paramType = type.rep();
      return new core.Variable(name, paramType);
    },

    Type_array(type, _brackets) {
      const baseType = type.rep();
      return new core.ArrayType(baseType);
    },

    Exp_binary(cond1, relop, cond2) {
      const left = cond1.rep();
      operator = relop.sourceString;
      const right = cond2.rep();
      return new core.BinaryExp(left, operator, right);
    },

    Condition_binary(cond, op, term) {
      const left = cond.rep();
      operator = op.sourceString;
      const right = term.rep();
      return new core.BinaryExp(left, operator, right);
    },

    Term_binary(term, op, factor) {
      const left = term.rep();
      operator = op.sourceString;
      const right = factor.rep();
      return new core.BinaryExp(left, operator, right);
    },

    Factor_binary(primary, op, factor) {
      const left = primary.rep();
      operator = op.sourceString;
      const right = factor.rep();
      return new core.BinaryExp(left, operator, right);
    },

    Factor_negation(op, primary) {
      const left = primary.rep();
      operator = op.sourceString;
      return new core.UnaryExp(operator, left);
    },

    Var_subscript(variable, _open, exp, _close) {
      const subscript = exp.rep();
      return new core.SubscriptExp(variable, subscript);
    },

    Var_id(id) {
      return id.sourceString;
    },

    Call(id, _open, exps, _close) {
      // here
      const args = exps.children.map((e) => e.rep());
      return new core.Call(id.sourceString, args);
    },

    num(_int, _dot, _frac, _e, _sign, _exp) {
      return Number(this.sourceString);
    },

    strlit(_open, chars, _close) {
      return this.sourceString;
    },

    true(_) {
      return true;
    },

    false(_) {
      return false;
    },
  });

  return analyzer(match).rep();
}
