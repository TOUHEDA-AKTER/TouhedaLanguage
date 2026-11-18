
/**
 * TouhedaLanguage - JavaScript Code Generator
 * Version: 1.0
 *
 * Converts TouhedaLanguage AST into JavaScript source code.
 */

class CodeGenerator {

    constructor() {
        this.indentLevel = 0;
        this.indentSize = 4;
    }

    generate(ast) {
        if (!ast || ast.type !== "Program") {
            throw new TypeError("A valid Program AST is required.");
        }

        this.indentLevel = 0;

        return ast.body
            .map(statement => this.generateStatement(statement))
            .filter(Boolean)
            .join("\n");
    }

    generateStatement(node) {
        switch (node.type) {

            case "VariableDeclaration":
                return this.indent() +
                    `let ${node.name} = ${this.generateExpression(node.initializer)};`;

            case "PrintStatement":
                return this.indent() +
                    `console.log(${this.generateExpression(node.expression)});`;

            case "IfStatement":
                return this.generateIfStatement(node);

            case "LoopStatement":
                return this.generateLoopStatement(node);

            case "FunctionDeclaration":
                return this.generateFunctionDeclaration(node);

            case "ReturnStatement":
                return this.indent() +
                    `return ${this.generateExpression(node.value)};`;

            case "ExpressionStatement":
                return this.indent() +
                    `${this.generateExpression(node.expression)};`;

            default:
                throw new Error(
                    `Unsupported statement type: ${node.type}`
                );
        }
    }

    generateIfStatement(node) {
        let code = this.indent() +
            `if (${this.generateExpression(node.condition)}) {\n`;

        code += this.generateBlock(node.thenBranch);

        code += this.indent() + "}";

        if (node.elseBranch) {
            code += " else {\n";
            code += this.generateBlock(node.elseBranch);
            code += this.indent() + "}";
        }

        return code;
    }

    generateLoopStatement(node) {
        const count = this.generateExpression(node.count);
        const loopVariable = "__touheda_i";

        let code = this.indent() +
            `for (let ${loopVariable} = 0; ${loopVariable} < (${count}); ${loopVariable}++) {\n`;

        code += this.generateBlock(node.body);
        code += this.indent() + "}";

        return code;
    }

    generateFunctionDeclaration(node) {
        const parameters = node.parameters.join(", ");

        let code = this.indent() +
            `function ${node.name}(${parameters}) {\n`;

        code += this.generateBlock(node.body);
        code += this.indent() + "}";

        return code;
    }

    generateBlock(statements) {
        this.indentLevel++;

        const code = statements
            .map(statement => this.generateStatement(statement))
            .filter(Boolean)
            .join("\n");

        this.indentLevel--;

        return code ? code + "\n" : "";
    }

    generateExpression(node) {
        if (!node) {
            throw new Error("Expression node is missing.");
        }

        switch (node.type) {

            case "Literal":
                return this.generateLiteral(node.value);

            case "Identifier":
                return node.name;

            case "BinaryExpression":
                return `(${this.generateExpression(node.left)} ${this.generateOperator(node.operator)} ${this.generateExpression(node.right)})`;

            case "LogicalExpression":
                return `(${this.generateExpression(node.left)} ${this.generateOperator(node.operator)} ${this.generateExpression(node.right)})`;

            case "UnaryExpression":
                return this.generateUnaryExpression(node);

            case "CallExpression":
                return `${node.name}(${node.arguments.map(argument => this.generateExpression(argument)).join(", ")})`;

            default:
                throw new Error(
                    `Unsupported expression type: ${node.type}`
                );
        }
    }

    generateUnaryExpression(node) {
        const operator = this.generateOperator(node.operator);

        if (operator === "!") {
            return `(!${this.generateExpression(node.right)})`;
        }

        return `(${operator}${this.generateExpression(node.right)})`;
    }

    generateOperator(operator) {
        const operators = {
            "boro": ">",
            "choto": "<",
            "boro ba soman": ">=",
            "choto ba soman": "<=",
            "not =": "!==",
            "!=": "!==",
            "==": "===",
            "and": "&&",
            "or": "||",
            "not": "!"
        };

        return operators[operator] || operator;
    }

    generateLiteral(value) {
        if (typeof value === "string") {
            return JSON.stringify(value);
        }

        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }

        if (value === null) {
            return "null";
        }

        return String(value);
    }

    indent() {
        return " ".repeat(this.indentLevel * this.indentSize);
    }
}

module.exports = CodeGenerator;
