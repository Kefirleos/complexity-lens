import * as assert from 'assert';
import { analyzeComplexity } from '../analyzer';

suite('Complexity analyzer', () => {
    test('Returns no functions for an empty file', () => {
        assert.deepStrictEqual(analyzeComplexity('', 'sample.ts'), []);
    });

    test('A function without branches has complexity 1', () => {
        const code = '\nfunction simple() { return 42; }';

        assert.deepStrictEqual(analyzeComplexity(code, 'sample.ts'), [
            {
                name: 'simple',
                start: code.indexOf('function'),
                complexity: 1
            }
        ]);
    });

    const cases: Array<[string, string, number]> = [
        ['if / else', 'if (x) {} else {}', 2],
        ['else if', 'if (x) {} else if (y) {}', 3],
        ['for', 'for (let i = 0; i < 3; i++) {}', 2],
        ['for in', 'for (const key in x) {}', 2],
        ['for of', 'for (const item of x) {}', 2],
        ['while', 'while (x) {}', 2],
        ['do while', 'do {} while (x);', 2],
        [
            'switch',
            'switch (x) { case 1: break; case 2: break; default: break; }',
            3
        ],
        ['catch', 'try {} catch (error) {} finally {}', 2],
        ['ternary', 'return x ? 1 : 0;', 2],
        ['logical AND', 'return x && y;', 2],
        ['logical OR', 'return x || y;', 2],
        ['nullish coalescing', 'return x ?? y;', 2],
        ['combined conditions', 'if (x && y || z) {}', 4]
    ];

    for (const [name, body, expected] of cases) {
        test(`Counts ${name}`, () => {
            const code = `function example(x, y, z) { ${body} }`;
            const results = analyzeComplexity(code, 'sample.ts');

            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].complexity, expected);
        });
    }

    test('Counts nested functions separately', () => {
        const code = `
            function outer(x) {
                function inner(y) {
                    if (y) { return 1; }
                    return 0;
                }
                return inner(x);
            }
        `;

        const results = analyzeComplexity(code, 'sample.ts');

        assert.deepStrictEqual(
            results.map(({ name, complexity }) => ({ name, complexity })),
            [
                { name: 'outer', complexity: 1 },
                { name: 'inner', complexity: 2 }
            ]
        );
    });

    test('Recognizes different function forms', () => {
        const code = `
            const arrow = (x) => x ? 1 : 0;
            const expression = function () { return 1; };

            class Example {
                constructor() {}
                method() {}
                get value() { return 1; }
                set value(x) {}
            }
        `;

        const results = analyzeComplexity(code, 'sample.ts');

        assert.deepStrictEqual(
            results.map(({ name, complexity }) => ({ name, complexity })),
            [
                { name: 'arrow', complexity: 2 },
                { name: 'expression', complexity: 1 },
                { name: 'constructor', complexity: 1 },
                { name: 'method', complexity: 1 },
                { name: 'value', complexity: 1 },
                { name: 'value', complexity: 1 }
            ]
        );
    });

    test('Analyzes JavaScript files', () => {
        const results = analyzeComplexity(
            'function example(x) { if (x) { return 1; } return 0; }',
            'sample.js'
        );

        assert.strictEqual(results[0].complexity, 2);
    });
});