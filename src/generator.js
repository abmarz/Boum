import {
  ArrayExp,
  AssignStmt,
  BinaryExp,
  Call,
  FunDec,
  PrintStmt,
  ReturnStmt,
  SubscriptExp,
  UnaryExp,
  VarDec,
  Variable,
  WhileStmt,
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
    if (node instanceof Call) {
      const args = node.args.map(genExpr).join(", ");
      return `${node.fun}(${args})`;
    }
    if (node instanceof ArrayExp) {
      const elems = node.elements.map(genExpr).join(", ");
      return `[${elems}]`;
    }
    if (node instanceof SubscriptExp) {
      return `${genExpr(node.array)}[${genExpr(node.subscript)}]`;
    }

    throw new Error(`Unrecognized expression node in generator: ${node}`);
  }

  function genStmt(node) {
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

    if (node instanceof Call) {
      const args = node.args.map(genExpr).join(", ");
      output.push(`${node.fun}(${args});`);
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
    if (node instanceof ReturnStmt) {
      let expr = "";
      if (node.expression !== undefined && node.expression !== null) {
        expr = genExpr(node.expression);
      }
      output.push(`return ${expr};`);
      return;
    }
    if (node instanceof FunDec) {
      const params = node.fun.params.map((p) => p.name).join(", ");
      output.push(`function ${node.fun.name}(${params}) {`);
      genStmt(node.body);
      output.push("}");
      return;
    }
    if (node instanceof WhileStmt) {
      const test = genExpr(node.test);
      output.push(`while (${test}) {`);
      genStmt(node.body);
      output.push("}");
      return;
    }
    if (Array.isArray(node)) {
      for (const stmt of node) genStmt(stmt);
      return;
    }

    throw new Error(`Unrecognized statement node in generator: ${node}`);
  }

  for (const stmt of program.statements) {
    genStmt(stmt);
  }
  return output.join("\n");
}

// In the spirit of academic honesty this is built off of How to write a compiler (cs.lmu.edu/~ray), and some AI tools such as copilot were used for troubleshooting and amplifying.
