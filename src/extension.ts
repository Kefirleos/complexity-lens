import * as vscode from 'vscode';
import { ComplexityCodeLensProvider } from './complexityCodeLensProvider';

export function activate(context: vscode.ExtensionContext): void {
    const selector: vscode.DocumentSelector = [
        { language: 'javascript' },
        { language: 'javascriptreact' },
        { language: 'typescript' },
        { language: 'typescriptreact' }
    ];

    const provider = vscode.languages.registerCodeLensProvider(
        selector,
        new ComplexityCodeLensProvider()
    );

    const command = vscode.commands.registerCommand(
        'complexity-lens.showDetails',
        (name: string, complexity: number) => {
            void vscode.window.showInformationMessage(
                `${name}: цикломатическая сложность — ${complexity}. `
                + 'Базовое значение 1 плюс количество ветвлений.'
            );
        }
    );

    context.subscriptions.push(provider, command);
}

export function deactivate(): void {}