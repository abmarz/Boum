import * as fs from "node:fs";
import * as ohm from "ohm-js";
const grammar = ohm.grammar(fs.readFileSync("src/boum.ohm"));

export default function parse(sourceCode) {
  const match = grammar.match(sourceCode);
  if (!match.succeeded()) throw new Error(match.message);
  return match;
}

// In the spirit of academic honesty this is built off of How to write a compiler (cs.lmu.edu/~ray)
