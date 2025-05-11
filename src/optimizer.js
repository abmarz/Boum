import * as core from "../src/core.js";

export default function optimize(node) {
  if (node == null) return node;

  if (
    typeof node === "number" ||
    typeof node === "bigint" ||
    typeof node === "string" ||
    typeof node === "boolean"
  ) {
    return node;
  }

  if (node instanceof core.Program) {
    return new core.Program(node.statements.map(optimize));
  }

  if (node instanceof core.PrintStmt) {
    return new core.PrintStmt(optimize(node.argument));
  }

  if (node instanceof core.VarDec) {
    return new core.VarDec(node.variable, optimize(node.initializer));
  }

  if (node instanceof core.AssignStmt) {
    return new core.AssignStmt(node.target, optimize(node.source));
  }

  if (node instanceof core.WhileStmt) {
    return new core.WhileStmt(optimize(node.test), node.body.map(optimize));
  }

  if (node instanceof core.FunDec) {
    return new core.FunDec(optimize(node.fun), node.body.map(optimize));
  }

  if (node instanceof core.ReturnStmt) {
    return new core.ReturnStmt(optimize(node.expression));
  }

  if (node instanceof core.BinaryExp) {
    const left = optimize(node.left);
    const right = optimize(node.right);
    if (
      (node.op === "+" ||
        node.op === "-" ||
        node.op === "*" ||
        node.op === "/") &&
      (typeof left === "number" || typeof left === "bigint") &&
      (typeof right === "number" || typeof right === "bigint")
    ) {
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
      }
    }
    if (node.op === "-" && left === 0) {
      return new core.UnaryExp("-", right);
    }
    if (node.op === "??" && left == null) {
      return right;
    }
    return new core.BinaryExp(node.op, left, right, node.type);
  }

  if (node instanceof core.UnaryExp) {
    const operand = optimize(node.operand);
    if (
      node.op === "-" &&
      (typeof operand === "number" || typeof operand === "bigint")
    ) {
      return -operand;
    }
    return new core.UnaryExp(node.op, operand, node.type);
  }

  if (node instanceof core.ArrayExp) {
    return new core.ArrayExp(node.elements.map(optimize));
  }

  if (node instanceof core.SubscriptExp) {
    const arr = optimize(node.array);
    const idx = optimize(node.subscript);
    return new core.SubscriptExp(arr, idx);
  }

  if (node instanceof core.Call) {
    const fun = optimize(node.fun);
    const args = node.args.map(optimize);
    return new core.Call(fun, args);
  }

  return node;
}

// AI help used in creating this optimizer. But mostly drawn from How to write a compiler (cs.lmu.edu/~ray/notes/)
