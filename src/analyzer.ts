import * as ts from 'typescript';

export interface FunctionComplexity {
    name: string;
    start: number;
    complexity: number;
}

type FunctionNode =
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction
    | ts.MethodDeclaration
    | ts.ConstructorDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration;

function isFunctionNode(node: ts.Node): node is FunctionNode {
    return ts.isFunctionDeclaration(node)
        || ts.isFunctionExpression(node)
        || ts.isArrowFunction(node)
        || ts.isMethodDeclaration(node)
        || ts.isConstructorDeclaration(node)
        || ts.isGetAccessorDeclaration(node)
        || ts.isSetAccessorDeclaration(node);
}

function getFunctionName(
    node: FunctionNode,
    sourceFile: ts.SourceFile
): string {
    if (ts.isConstructorDeclaration(node)) {
        return 'constructor';
    }

    if (node.name) {
        return node.name.getText(sourceFile);
    }

    const parent = node.parent;

    if (ts.isVariableDeclaration(parent)
        || ts.isPropertyAssignment(parent)
        || ts.isPropertyDeclaration(parent)) {
        return parent.name.getText(sourceFile);
    }

    return '<anonymous>';
}

function countComplexity(body: ts.Node): number {
    let complexity = 1;

    function visit(node: ts.Node): void {
        if (isFunctionNode(node)) {
            return;
        }

        if (
            ts.isIfStatement(node)
            || ts.isForStatement(node)
            || ts.isForInStatement(node)
            || ts.isForOfStatement(node)
            || ts.isWhileStatement(node)
            || ts.isDoStatement(node)
            || ts.isCaseClause(node)
            || ts.isCatchClause(node)
            || ts.isConditionalExpression(node)
        ) {
            complexity += 1;
        }

        if (ts.isBinaryExpression(node)) {
            const operator = node.operatorToken.kind;

            if (
                operator === ts.SyntaxKind.AmpersandAmpersandToken
                || operator === ts.SyntaxKind.BarBarToken
                || operator === ts.SyntaxKind.QuestionQuestionToken
            ) {
                complexity += 1;
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(body);
    return complexity;
}

export function analyzeComplexity(
    code: string,
    fileName: string
): FunctionComplexity[] {
    const sourceFile = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true
    );

    const results: FunctionComplexity[] = [];

    function visit(node: ts.Node): void {
        if (isFunctionNode(node) && node.body) {
            results.push({
                name: getFunctionName(node, sourceFile),
                start: node.getStart(sourceFile),
                complexity: countComplexity(node.body)
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return results;
}