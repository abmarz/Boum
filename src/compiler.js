import analyze from "../src/analyzer.js";
import generate from "../src/generator.js";
import optimize from "../src/optimizer.js";
import parse from "../src/parser.js";

export default function compile(source, outputType) {
  if (!["parsed", "analyzed", "optimized", "js"].includes(outputType)) {
    throw new Error("Unknown output type");
  }
  const match = parse(source);
  if (outputType === "parsed") return "Syntax is ok";
  const analyzed = analyze(match);
  if (outputType === "analyzed") return analyzed;
  const optimized = optimize(analyzed);
  if (outputType === "optimized") return optimized;
  return generate(optimized);
}

// In the spirit of academic honesty this is built off of How to write a compiler (cs.lmu.edu/~ray).
