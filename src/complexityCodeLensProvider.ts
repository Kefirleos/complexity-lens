import * as vscode from 'vscode';
import { analyzeComplexity } from './analyzer';

export class ComplexityCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] {
        if (token.isCancellationRequested) {
            return [];
        }

        const functions = analyzeComplexity(
            document.getText(),
            document.fileName
        );

        return functions.map((result) => {
            const position = document.positionAt(result.start);
            const range = new vscode.Range(position, position);

            return new vscode.CodeLens(range, {
                title: `Сложность: ${result.complexity}`,
                command: 'complexity-lens.showDetails',
                arguments: [result.name, result.complexity],
                tooltip: 'Показать сведения о цикломатической сложности'
            });
        });
    }
}