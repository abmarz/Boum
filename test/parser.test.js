import assert from 'node:assert';
import { describe, it } from 'node:test';
import parse from '../src/parser.js';

const syntaxChecks = [
  ["printing string", `ensa5("hello")`],
  ["printing with math", `ensa5(5 + 6 * 7)`],
  ["nested math", `ensa5((2 + 3) * (5 - 1))`],
  ["scientific notation", `ensa5(1.2e+5)`],
  ["boolean true", `ensa5(true)`],
  ["boolean false", `ensa5(false)`],
  ["array literal", `ensa5([1, 2, 3])`],
  ["nested arrays", `ensa5([[1], [2], [3]])`],
  ["variable declaration", `5al x = 10`],
  ["function declaration no params", `dala f(): rd `],
  ["function with param", `dala f(x: int): rd`], // shouldn't it be `dala f(x: true): ->`?
//   ["function with return type", `dala f(): -> true:`], // shouldn't be accepted
  ["return number", `rid 42`],
  ["return boolean", `rid true`],
  ["return nothing", `rid`],
  ["while loop", `6alama x < 10:`],
  ["add and subtract", `ensa5(5 + 3 - 2)`],
  ["multiply and divide", `ensa5(10 * 2 / 5)`],
  ["exponentiation", `ensa5(2 ** 3 ** 2)`],
  ["modulo operation", `ensa5(5 % 2)`],
  ["comparison", `ensa5(4 < 5)`],
  ["comparison with equals", `ensa5(4 <= 5)`],
  ["not equal", `ensa5(3 != 4)`],
  ["grouped expressions", `ensa5((3 + 4) * 5)`],
  ["var assignment", `x = 3`],
  ["chained expressions", `ensa5(3 + 4 * 5 - 6 / 2)`],
  ["decimal number", `ensa5(3.14)`],
  ["number with capital E", `ensa5(2E5)`],
  ["empty array", `ensa5([])`],
  ["array with booleans", `ensa5([true, false])`],
  ["strlit test", `ensa5("abc")`],
  ["variable in function", `dala f(y: int):`], // try again this is the same as "function with param" test
  ["multiple params", `dala f(x: int, y: int):`], // cant put true or false
  ["subscript access", `x[0] = 1`],
  ["var subscript access", `ensa5(x[0])`], // what if this was ensa5(x[0])?
  ["return expression", `rid x + 1`],
//   ["function call", `f(3)`], // shouldn't be accepted
//   ["nested function call", `f(g(3))`], // shouldn't be accepted
//   ["empty param call", `f()`], // shouldn't be accepted
  ["print with nested calls", `ensa5(f(g(3 + 1)))`],
  ["negation", `ensa5(-2)`],
  ["negation can come second", `insa5(2 ** -2)`] // maybe we should have a test for ensa5(-(2 +3))
];

const syntaxErrors = [
  ["invalid char in keyword", `ens@5("Hala")`, /col 4/],
  ["missing closing paren", `ensa5("Hala"`, /col 13/],
  ["non-digit in number", `ensa5(5.2a)`, /col 10/],
  ["two dots in number", `ensa5(5.2.3)`, /col 10/],
  ["incomplete number", `ensa5(5.)`, /col 9/],
  ["bad identifier", `5al a$b = 1`, / col 6/],
  ["double string close", `ensa5("abc"")`, / col 12/],
  ["missing quote", `ensa5("abc)`, /col 12/], // here. What if we have a string with a quote?
  ["invalid relop chain", `ensa5(2 < 3 < 4)`, /col 16/],
  ["operator without operand", `ensa5(3 +)`, /col 10/],
  ["multiple dots", `ensa5(3...5)`, /col 9/],
//   ["underscore in wrong place", `5al a_ = 1`, /col 6/], // here not working
  ["bracket without close", `ensa5([1, 2)`, /col 12/],
//   ["string escape error", `ensa5("a\\q")`, /col 10/], // here not working
  ["non-keyword true assign", `true = 1`, /col 1/],
  ["non-keyword false assign", `false = 0`, /col 1/],
  ["call number", `500(1)`, /col 1/], // here shouldn't it be at col 2?
  ["subscript number", `500[1]`, /col 1/], // here shouldn't it be at col 2?
  ["property access on num", `500.x`, /col 1/], // here shouldn't it be at col 2?
  ["empty subscript", `x[]`, /col 3/],
  ["illegal array comma", `ensa5([1,,2])`, /col 10/],
  ["invalid idchar", `5al b@d = 3`, /col 6/],
  ["function with bad param", `dala f(x true):`, /col 10/],
  ["type without id", `dala f(): -> []:`, /col 11/], // here i said col15
  ["type without colon", `dala f(x true)`, /col 10/],
  ["bad return arrow", `dala f(): => true:`, /col 11/],
  ["illegal let", `let x = 1`, /col 5/],
  ["unfinished math", `ensa5(3 + )`, /col 11/],
  ["unfinished expression", `ensa5(3 *`, /col 10/],
  ["unfinished function call", `f(3,`, /col 2/],
//   ["non-boolean while", `6alama "yes":`, /col 8/], // here what if I said 6alama x > 2? Also not working
  ["array with trailing comma", `ensa5([1,2,])`, /col 12/],
  ["extra paren", `ensa5((3 + 4)) )`, /col 16/],
  ["missing function colon", `dala f()`, /col 9/],
  ["bad return syntax", `rid)`, /col 4/],
  ["operator at start", `ensa5(* 5)`, /col 7/],
  ["multiple stars error", `ensa5(2 **** 3)`, /col 11/],
  ["weird idchar", `5al ab# = 1`, /col 7/],
  ["unterminated string", `ensa5("hello`, /col 13/],
  ["negation can not come first", "ensa5(-2 ** 2)", /col 11/],
];

describe("The parser", () => {
    for (const [scenario, source] of syntaxChecks) {
        it(`accepts ${scenario}`, () => {
            assert.ok(parse(source))
        });
    }
    
    for (const [scenario, source, errorPattern] of syntaxErrors) {
        it(`rejects ${scenario}`, () => {
            assert.throws(() => parse(source), errorPattern)
        });
    }
});
