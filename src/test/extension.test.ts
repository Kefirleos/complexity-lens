import * as assert from 'assert';
import * as vscode from 'vscode';

async function getComplexityLenses(
    document: vscode.TextDocument
): Promise<vscode.CodeLens[]> {
    const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
        'vscode.executeCodeLensProvider',
        document.uri
    );

    return (lenses ?? []).filter(
        (lens) => lens.command?.command === 'complexity-lens.showDetails'
    );
}

suite('Complexity CodeLens integration', () => {
    suiteSetup(async function () {
        this.timeout(10000);

        const extension = vscode.extensions.all.find(
            (item) => item.packageJSON.name === 'complexity-lens'
        );

        assert.ok(extension, 'Extension must be available in the test host');
        await extension.activate();
    });

    test('Shows complexity at the function line', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: [
                '// Example',
                'function check(value: number) {',
                '    if (value > 0 && value < 10) { return true; }',
                '    return false;',
                '}',
                'const choose = (value: boolean) => value ? 1 : 0;'
            ].join('\n')
        });

        const lenses = await getComplexityLenses(document);

        assert.strictEqual(lenses.length, 2);

        assert.strictEqual(lenses[0].range.start.line, 1);
        assert.strictEqual(lenses[0].range.end.line, 1);
        assert.strictEqual(lenses[0].command?.title, 'Сложность: 3');
        assert.deepStrictEqual(
            lenses[0].command?.arguments,
            ['check', 3]
        );

        assert.strictEqual(lenses[1].range.start.line, 5);
        assert.strictEqual(lenses[1].command?.title, 'Сложность: 2');
        assert.deepStrictEqual(
            lenses[1].command?.arguments,
            ['choose', 2]
        );
    });

    test('Registers the provider for all supported languages', async () => {
        const languages = [
            'javascript',
            'javascriptreact',
            'typescript',
            'typescriptreact'
        ];

        for (const language of languages) {
            const document = await vscode.workspace.openTextDocument({
                language,
                content: 'function simple() { return 42; }'
            });

            const lenses = await getComplexityLenses(document);

            assert.strictEqual(lenses.length, 1, language);
            assert.strictEqual(
                lenses[0].command?.title,
                'Сложность: 1',
                language
            );
        }
    });

    test('Returns no lenses when there are no functions', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'const value = 42;'
        });

        assert.deepStrictEqual(await getComplexityLenses(document), []);
    });

    test('Uses updated document content after an edit', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: 'function check(x) { return x; }'
        });

        const before = await getComplexityLenses(document);
        assert.strictEqual(before[0].command?.title, 'Сложность: 1');

        const edit = new vscode.WorkspaceEdit();
        const wholeDocument = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        edit.replace(
            document.uri,
            wholeDocument,
            'function check(x) { if (x) { return 1; } return 0; }'
        );

        assert.strictEqual(await vscode.workspace.applyEdit(edit), true);

        const after = await getComplexityLenses(document);
        assert.strictEqual(after[0].command?.title, 'Сложность: 2');
    });
});