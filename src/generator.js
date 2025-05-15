import {
  AssignStmt,
  BinaryExp,
  PrintStmt,
  Program,
  UnaryExp,
  VarDec,
  Variable,
} from "./core.js";

export default function generate(program) {
  const output = [];
  const nameCounts = Object.create(null);
  const nameMap = Object.create(null);

  function genExpr(node) {
    if (node === null) return "null";
    if (node === undefined) return "undefined";
    if (typeof node === "number" || node instanceof Number) {
      return node.valueOf().toString();
    }

    if (typeof node === "boolean" || node instanceof Boolean) {
      return node.valueOf().toString();
    }
    if (typeof node === "string" || node instanceof String) {
      return JSON.stringify(node.valueOf());
    }
    if (node instanceof Variable) {
      return nameMap[node.name] || node.name;
    }
    if (node instanceof BinaryExp) {
      const L = genExpr(node.left);
      const R = genExpr(node.right);
      return `${L} ${node.op} ${R}`;
    }
    if (node instanceof UnaryExp) {
      const operandStr = genExpr(node.operand);
      if (node.op === "-" && node.operand instanceof UnaryExp) {
        return `- ${operandStr}`;
      }
      if (node.op === "-" && node.operand instanceof BinaryExp) {
        return `-(${operandStr})`;
      }
      return `${node.op}${operandStr}`;
    }

    throw new Error(`Unrecognized expression node in generator: ${node}`);
  }

  function genStmt(node) {
    if (node instanceof Program) {
      for (const stmt of node.statements) genStmt(stmt);
      return;
    }

    if (node instanceof VarDec) {
      const orig = node.variable.name;
      const cnt = (nameCounts[orig] || 0) + 1;
      nameCounts[orig] = cnt;
      const uniq = `${orig}_${cnt}`;
      nameMap[orig] = uniq;

      const init = genExpr(node.initializer);
      output.push(`let ${uniq} = ${init};`);
      return;
    }

    if (node instanceof AssignStmt) {
      const T = genExpr(node.target);
      const S = genExpr(node.source);
      output.push(`${T} = ${S};`);
      return;
    }

    if (node instanceof PrintStmt) {
      const A = genExpr(node.argument);
      output.push(`console.log(${A});`);
      return;
    }

    throw new Error(`Unrecognized statement node in generator: ${node}`);
  }

  genStmt(program);
  return output.join("\n");
}

// Mostly drawn from How to write a compiler (cs.lmu.edu/~ray). Though some AI was used for troubleshooting and amplifying.
