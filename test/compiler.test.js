// import { deepEqual } from 'node:assert/strict';
// import { describe, it } from 'node:test';

// describe('Compiler', () => {
//     it('is alive', () => {
//         deepEqual(1, 1);
//     });
// });

import assert from 'node:assert';
import { describe, it } from 'node:test';
import compile from '../src/compiler.js';

describe ("The compiler", () => {
    it("is alive", () => {
        assert.equal(compile('print "Hello'), "it works");
    });
});
