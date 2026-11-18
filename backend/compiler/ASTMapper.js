
/**
 * TouhedaLanguage - AST Mapper
 * Version: 1.0
 *
 * Converts the Concrete Parse Tree into an Abstract Syntax Tree.
 */

class ASTMapper {

    map(parseTree) {
        const root = parseTree && typeof parseTree.getRoot === "function"
            ? parseTree.getRoot()
            : parseTree;

        if (!root || typeof root !== "object") {
            throw new TypeError("A valid Parse Tree is required.");
        }

        if (root.type !== "Program") {
            throw new Error("Parse Tree root must be a Program node.");
        }

        return {
            type: "Program",
            body: this.mapStatements(root.children || [])
        };
    }

    mapStatements(children) {
        return children
            .filter(child => child && child.type === "Statement")
            .map(child => this.mapStatement(child));
    }

    mapStatement(statementNode) {
        const node = this.firstNode(statementNode);

        if (!node) {
            throw new Error("Invalid Statement node.");
        }

        switch (node.type) {
            case "VariableDeclaration":
                return this.mapVariableDeclaration(node);

            case "PrintStatement":
                return this.mapPrintStatement(node);

            case "IfStatement":
                return this.mapIfStatement(node);

            case "LoopStatement":
                return this.mapLoopStatement(node);

            case "FunctionDeclaration":
                return this.mapFunctionDeclaration(node);

            case "ReturnStatement":
                return this.mapReturnStatement(node);

            case "ExpressionStatement":
                return this.mapExpressionStatement(node);

            default:
                throw new Error(
                    `Unsupported statement type: ${node.type}`
                );
        }
    }

    mapVariableDeclaration(node) {
        const identifier = this.findChild(node, "Identifier");
        const expression = this.findChild(node, "Expression");

        if (!identifier || !expression) {
            throw new Error("Invalid variable declaration.");
        }

        return {
            type: "VariableDeclaration",
            name: identifier.value,
            initializer: this.mapExpression(expression)
        };
    }

    mapPrintStatement(node) {
        const expression = this.findChild(node, "Expression");

        if (!expression) {
            throw new Error("Invalid print statement.");
        }

        return {
            type: "PrintStatement",
            expression: this.mapExpression(expression)
        };
    }

    mapIfStatement(node) {
        const expressions = this.findChildren(node, "Expression");
        const blocks = this.findChildren(node, "Block");

        if (expressions.length === 0 || blocks.length === 0) {
            throw new Error("Invalid if statement.");
        }

        return {
            type: "IfStatement",
            condition: this.mapExpression(expressions[0]),
            thenBranch: this.mapBlock(blocks[0]),
            elseBranch: blocks[1]
                ? this.mapBlock(blocks[1])
                : null
        };
    }

    mapLoopStatement(node) {
        const expression = this.findChild(node, "Expression");
        const block = this.findChild(node, "Block");

        if (!expression || !block) {
            throw new Error("Invalid loop statement.");
        }

        return {
            type: "LoopStatement",
            count: this.mapExpression(expression),
            body: this.mapBlock(block)
        };
    }

    mapFunctionDeclaration(node) {
        const identifier = this.findChild(node, "Identifier");
        const parameterList = this.findChild(node, "ParameterList");
        const block = this.findChild(node, "Block");

        if (!identifier || !block) {
            throw new Error("Invalid function declaration.");
        }

        const parameters = parameterList
            ? parameterList.children
                .filter(child => child.type === "Identifier")
                .map(child => child.value)
            : [];

        return {
            type: "FunctionDeclaration",
            name: identifier.value,
            parameters,
            body: this.mapBlock(block)
        };
    }

    mapReturnStatement(node) {
        const expression = this.findChild(node, "Expression");

        if (!expression) {
            throw new Error("Invalid return statement.");
        }

        return {
            type: "ReturnStatement",
            value: this.mapExpression(expression)
        };
    }

    mapExpressionStatement(node) {
        const expression = this.findChild(node, "Expression");

        if (!expression) {
            throw new Error("Invalid expression statement.");
        }

        return {
            type: "ExpressionStatement",
            expression: this.mapExpression(expression)
        };
    }

    mapBlock(blockNode) {
        return (blockNode.children || [])
            .filter(child => child.type === "Statement")
            .map(child => this.mapStatement(child));
    }

    mapExpression(expressionNode) {
        if (!expressionNode) {
            throw new Error("Expression node is missing.");
        }

        const child = this.firstNode(expressionNode);

        if (!child) {
            throw new Error("Invalid Expression node.");
        }

        return this.mapLogicalOr(child);
    }

    mapLogicalOr(node) {
        return this.mapBinaryLevel(
            node,
            "LogicalOr",
            "LogicalExpression"
        );
    }

    mapLogicalAnd(node) {
        return this.mapBinaryLevel(
            node,
            "LogicalAnd",
            "LogicalExpression"
        );
    }

    mapEquality(node) {
        return this.mapBinaryLevel(
            node,
            "Equality",
            "BinaryExpression"
        );
    }

    mapComparison(node) {
        return this.mapBinaryLevel(
            node,
            "Comparison",
            "BinaryExpression"
        );
    }

    mapAddition(node) {
        return this.mapBinaryLevel(
            node,
            "Addition",
            "BinaryExpression"
        );
    }

    mapMultiplication(node) {
        return this.mapBinaryLevel(
            node,
            "Multiplication",
            "BinaryExpression"
        );
    }

    mapBinaryLevel(node, levelType, resultType) {
        if (node.type !== levelType) {
            return this.mapNextLevel(node, levelType);
        }

        const children = node.children || [];

        if (children.length === 0) {
            throw new Error(`Empty ${levelType} node.`);
        }

        let left = this.mapNextLevel(children[0], levelType);

        for (let i = 1; i < children.length; i += 2) {
            const operatorNode = children[i];
            const rightNode = children[i + 1];

            if (!operatorNode || !rightNode) {
                throw new Error(`Invalid ${levelType} expression.`);
            }

            const right = this.mapNextLevel(rightNode, levelType);

            left = {
                type: resultType,
                operator: operatorNode.value,
                left,
                right
            };
        }

        return left;
    }

    mapNextLevel(node, currentLevel) {
        const levels = [
            "LogicalOr",
            "LogicalAnd",
            "Equality",
            "Comparison",
            "Addition",
            "Multiplication"
        ];

        const index = levels.indexOf(currentLevel);
        const nextLevel = levels[index + 1];

        if (!nextLevel) {
            return this.mapUnary(node);
        }

        const mapper = {
            LogicalOr: () => this.mapLogicalOr(node),
            LogicalAnd: () => this.mapLogicalAnd(node),
            Equality: () => this.mapEquality(node),
            Comparison: () => this.mapComparison(node),
            Addition: () => this.mapAddition(node),
            Multiplication: () => this.mapMultiplication(node)
        };

        return mapper[nextLevel]();
    }

    mapUnary(node) {
        if (node.type !== "Unary") {
            return this.mapPrimary(node);
        }

        const children = node.children || [];

        if (children.length === 0) {
            throw new Error("Invalid unary expression.");
        }

        if (children.length === 1) {
            return this.mapUnary(children[0]);
        }

        return {
            type: "UnaryExpression",
            operator: children[0].value,
            right: this.mapUnary(children[1])
        };
    }

    mapPrimary(node) {
        if (!node) {
            throw new Error("Primary expression is missing.");
        }

        if (node.type === "Primary") {
            return this.mapPrimary(this.firstNode(node));
        }

        switch (node.type) {
            case "Number":
            case "String":
            case "Boolean":
                return {
                    type: "Literal",
                    value: node.value
                };

            case "Identifier":
                return {
                    type: "Identifier",
                    name: node.value
                };

            case "FunctionCall":
                return this.mapFunctionCall(node);

            case "Expression":
                return this.mapExpression(node);

            default:
                throw new Error(
                    `Unsupported primary expression: ${node.type}`
                );
        }
    }

    mapFunctionCall(node) {
        const identifier = this.findChild(node, "Identifier");
        const argumentList = this.findChild(node, "ArgumentList");

        if (!identifier) {
            throw new Error("Function call name is missing.");
        }

        const args = argumentList
            ? argumentList.children
                .filter(child => child.type === "Expression")
                .map(child => this.mapExpression(child))
            : [];

        return {
            type: "CallExpression",
            name: identifier.value,
            arguments: args
        };
    }

    firstNode(node) {
        return (node.children || []).find(
            child => child && typeof child === "object"
        ) || null;
    }

    findChild(node, type) {
        return (node.children || []).find(
            child => child && child.type === type
        ) || null;
    }

    findChildren(node, type) {
        return (node.children || []).filter(
            child => child && child.type === type
        );
    }
}

module.exports = ASTMapper;
