import assert from "assert/strict"; // might be node:assert/strict
import { describe, it } from "node:test";
import analyze from "../src/analyzer.js";
import * as core from "../src/core.js";
import parse from "../src/parser.js";

describe("The analyzer", () => {
    it("builds a proper representation of the program", () => {
        const rep = analyze(parse("ensa5(0)"));
        assert.deepEqual(rep, new core.Program([new core.PrintStmt(0)]));
    });
})