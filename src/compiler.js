import analyze from "./analyzer.js";
import generate from "./generator.js";
import optimize from "./optimizer.js";
import parse from "./parser.js";

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
