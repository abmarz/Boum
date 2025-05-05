export default function analyzer(match) {
  const analyzer = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(stmts) {
      return new core.Program([stmts.children.map((s) => s.rep())]);
    },
    PrintStmt(_print, _open, exp, _close) {
      return new core.PrintStmt(exp.rep());
    }, // might be an issue with _paren here
    AssignStmt(variable, _eq, exp) {},
    VarDec(_let, id, _eq, exp) {},

    WhileStmt(_while, exp, _semi) {
      const test = exp.rep();
      return new core.WhileStmt(test); // might need to add a body (block)
    },

    FunDec(_fun, id, params, type, colon) {},
    // should I do returnType from my ohm? if so it would be ReturnType(_arrow, type)
    ReturnStmt(_return, exps) {},
    Params(_open, params, _close) {},
    Param(id, _colon, type) {},
    Type_array(type, _brackets) {},

    Exp_binary(cond1, relop, cond2) {
      const left = cond1.rep();
      operator = relop.sourceString;
      const right = cond2.rep();
      return new core.BinaryExp(left, operator, right);
    },

    Condition_binary(exp, op, term) {
      const exp = cond1.rep();
      operator = op.sourceString;
      const right = term.rep();
      return new core.BinaryExp(exp, operator, right);
    },

    Term_binary(term, op, factor) {},
    Factor_binary(primary, op, factor) {},
    Factor_negation(op, primary) {},
    Var_subscript(variable, _open, exp, _close) {},
    Var_id(id) {},
    Call(id, _open, exps, _close) {},

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
