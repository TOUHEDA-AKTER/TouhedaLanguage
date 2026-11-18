
/**
 * TouhedaLanguage - Parser
 * Version: 2.0
 *
 * Converts tokens into a Concrete Parse Tree.
 */

const ParseTree = require("./ParseTree");

class Parser {
    constructor(tokens) {
        if (!Array.isArray(tokens)) {
            throw new TypeError("Parser requires an array of tokens.");
        }

        this.tokens = tokens;
        this.position = 0;
    }

    // =====================================
    // Main Parser
    // =====================================

    parse() {
        const statements = [];

        while (!this.isAtEnd()) {
            statements.push(this.parseStatement());
        }

        return ParseTree.createNode("Program", statements);
    }

    // =====================================
    // Node Helpers
    // =====================================

    node(type, children = []) {
        return ParseTree.createNode(type, children);
    }

    terminal(type, token) {
        return ParseTree.createTerminal(type, token.value);
    }

    keyword(value) {
        const token = this.consumeKeyword(
            value,
            `Expected keyword '${value}'.`
        );

        return this.terminal("Keyword", token);
    }

    punctuation(type, message) {
        return this.terminal(
            "Punctuation",
            this.consume(type, message)
        );
    }

    operator(...types) {
        if (!this.match(...types)) {
            this.throwError("Expected an operator.");
        }

        return this.terminal("Operator", this.previous());
    }

    // =====================================
    // Statement Parser
    // =====================================

    parseStatement() {
        let statement;

        if (this.checkKeyword("dhori")) {
            statement = this.parseVariableDeclaration();
        } else if (this.checkKeyword("dekhao")) {
            statement = this.parsePrintStatement();
        } else if (this.checkKeyword("jodi")) {
            statement = this.parseIfStatement();
        } else if (this.checkKeyword("loop")) {
            statement = this.parseLoopStatement();
        } else if (this.checkKeyword("function")) {
            statement = this.parseFunctionDeclaration();
        } else if (this.checkKeyword("return")) {
            statement = this.parseReturnStatement();
        } else if (
            this.check("IDENTIFIER") &&
            this.checkNext("LPAREN")
        ) {
            statement = this.parseExpressionStatement();
        } else {
            this.throwError(
                `Unexpected token '${this.current().value}'.`
            );
        }

        return this.node("Statement", [statement]);
    }

    // =====================================
    // Variable Declaration
    // dhori age = 20
    // =====================================

    parseVariableDeclaration() {
        const children = [
            this.keyword("dhori"),
            this.terminal(
                "Identifier",
                this.consume(
                    "IDENTIFIER",
                    "Expected a variable name after 'dhori'."
                )
            ),
            this.operator("ASSIGN"),
            this.parseExpression()
        ];

        return this.node("VariableDeclaration", children);
    }

    // =====================================
    // Print Statement
    // dekhao("Hello")
    // =====================================

    parsePrintStatement() {
        const children = [
            this.keyword("dekhao"),
            this.punctuation(
                "LPAREN",
                "Expected '(' after 'dekhao'."
            ),
            this.parseExpression(),
            this.punctuation(
                "RPAREN",
                "Expected ')' after output expression."
            )
        ];

        return this.node("PrintStatement", children);
    }

    // =====================================
    // If / Else Statement
    // =====================================

    parseIfStatement() {
        const children = [
            this.keyword("jodi"),
            this.punctuation(
                "LPAREN",
                "Expected '(' after 'jodi'."
            ),
            this.parseExpression(),
            this.punctuation(
                "RPAREN",
                "Expected ')' after condition."
            ),
            this.parseBlock()
        ];

        if (this.checkKeyword("nahole")) {
            children.push(this.keyword("nahole"));
            children.push(this.parseBlock());
        }

        return this.node("IfStatement", children);
    }

    // =====================================
    // Loop Statement
    // loop(5) { ... }
    // =====================================

    parseLoopStatement() {
        const children = [
            this.keyword("loop"),
            this.punctuation(
                "LPAREN",
                "Expected '(' after 'loop'."
            ),
            this.parseExpression(),
            this.punctuation(
                "RPAREN",
                "Expected ')' after loop count."
            ),
            this.parseBlock()
        ];

        return this.node("LoopStatement", children);
    }

    // =====================================
    // Function Declaration
    // =====================================

    parseFunctionDeclaration() {
        const children = [
            this.keyword("function"),
            this.terminal(
                "Identifier",
                this.consume(
                    "IDENTIFIER",
                    "Expected a function name."
                )
            ),
            this.punctuation(
                "LPAREN",
                "Expected '(' after function name."
            )
        ];

        if (!this.check("RPAREN")) {
            children.push(this.parseParameterList());
        }

        children.push(
            this.punctuation(
                "RPAREN",
                "Expected ')' after parameters."
            )
        );

        children.push(this.parseBlock());

        return this.node("FunctionDeclaration", children);
    }

    parseParameterList() {
        const children = [];

        children.push(
            this.terminal(
                "Identifier",
                this.consume(
                    "IDENTIFIER",
                    "Expected a parameter name."
                )
            )
        );

        while (this.match("COMMA")) {
            children.push(
                this.terminal("Punctuation", this.previous())
            );

            children.push(
                this.terminal(
                    "Identifier",
                    this.consume(
                        "IDENTIFIER",
                        "Expected a parameter name after comma."
                    )
                )
            );
        }

        return this.node("ParameterList", children);
    }

    // =====================================
    // Return Statement
    // return(value)
    // =====================================

    parseReturnStatement() {
        const children = [
            this.keyword("return"),
            this.punctuation(
                "LPAREN",
                "Expected '(' after 'return'."
            ),
            this.parseExpression(),
            this.punctuation(
                "RPAREN",
                "Expected ')' after return value."
            )
        ];

        return this.node("ReturnStatement", children);
    }

    // =====================================
    // Block Parser
    // =====================================

    parseBlock() {
        const children = [
            this.punctuation(
                "LBRACE",
                "Expected '{' to start a block."
            )
        ];

        while (
            !this.check("RBRACE") &&
            !this.isAtEnd()
        ) {
            children.push(this.parseStatement());
        }

        children.push(
            this.punctuation(
                "RBRACE",
                "Expected '}' after block."
            )
        );

        return this.node("Block", children);
    }

    // =====================================
    // Expression Statement
    // =====================================

    parseExpressionStatement() {
        return this.node(
            "ExpressionStatement",
            [this.parseExpression()]
        );
    }

    // =====================================
    // Expression Parser
    // =====================================

    parseExpression() {
        return this.node(
            "Expression",
            [this.parseOr()]
        );
    }

    // Logical OR
    parseOr() {
        const children = [this.parseAnd()];

        while (this.checkKeyword("or")) {
            children.push(this.keyword("or"));
            children.push(this.parseAnd());
        }

        return this.node("LogicalOr", children);
    }

    // Logical AND
    parseAnd() {
        const children = [this.parseEquality()];

        while (this.checkKeyword("and")) {
            children.push(this.keyword("and"));
            children.push(this.parseEquality());
        }

        return this.node("LogicalAnd", children);
    }

    // Equality
    parseEquality() {
        const children = [this.parseComparison()];

        while (
            this.check("EQUAL") ||
            this.check("NOT_EQUAL")
        ) {
            children.push(
                this.operator("EQUAL", "NOT_EQUAL")
            );

            children.push(this.parseComparison());
        }

        return this.node("Equality", children);
    }

    // Comparison
    parseComparison() {
        const children = [this.parseAddition()];

        while (
            this.check("GREATER_THAN") ||
            this.check("LESS_THAN") ||
            this.check("GREATER_EQUAL") ||
            this.check("LESS_EQUAL")
        ) {
            children.push(
                this.operator(
                    "GREATER_THAN",
                    "LESS_THAN",
                    "GREATER_EQUAL",
                    "LESS_EQUAL"
                )
            );

            children.push(this.parseAddition());
        }

        return this.node("Comparison", children);
    }

    // Addition and subtraction
    parseAddition() {
        const children = [this.parseMultiplication()];

        while (
            this.check("PLUS") ||
            this.check("MINUS")
        ) {
            children.push(
                this.operator("PLUS", "MINUS")
            );

            children.push(this.parseMultiplication());
        }

        return this.node("Addition", children);
    }

    // Multiplication, division and modulus
    parseMultiplication() {
        const children = [this.parseUnary()];

        while (
            this.check("MULTIPLY") ||
            this.check("DIVIDE") ||
            this.check("MODULUS")
        ) {
            children.push(
                this.operator(
                    "MULTIPLY",
                    "DIVIDE",
                    "MODULUS"
                )
            );

            children.push(this.parseUnary());
        }

        return this.node("Multiplication", children);
    }

    // Unary expression
    parseUnary() {
        if (
            this.checkKeyword("not") ||
            this.check("MINUS")
        ) {
            const operator = this.checkKeyword("not")
                ? this.keyword("not")
                : this.operator("MINUS");

            return this.node(
                "Unary",
                [operator, this.parseUnary()]
            );
        }

        return this.node("Unary", [this.parsePrimary()]);
    }

    // =====================================
    // Primary Expression
    // =====================================

    parsePrimary() {
        if (this.match("NUMBER")) {
            return this.node(
                "Primary",
                [this.terminal("Number", this.previous())]
            );
        }

        if (this.match("STRING")) {
            return this.node(
                "Primary",
                [this.terminal("String", this.previous())]
            );
        }

        if (this.checkKeyword("true") || this.checkKeyword("false")) {
            const value = this.current().value;
            const token = this.advance();

            return this.node(
                "Primary",
                [this.terminal("Boolean", {
                    ...token,
                    value: value === "true"
                })]
            );
        }

        if (this.check("IDENTIFIER")) {
            if (this.checkNext("LPAREN")) {
                return this.node(
                    "Primary",
                    [this.parseFunctionCall()]
                );
            }

            return this.node(
                "Primary",
                [
                    this.terminal(
                        "Identifier",
                        this.advance()
                    )
                ]
            );
        }

        if (this.match("LPAREN")) {
            const children = [
                this.terminal("Punctuation", this.previous()),
                this.parseExpression(),
                this.punctuation(
                    "RPAREN",
                    "Expected ')' after expression."
                )
            ];

            return this.node("Primary", children);
        }

        this.throwError(
            `Unexpected token '${this.current().value}' in expression.`
        );
    }

    // =====================================
    // Function Call
    // =====================================

    parseFunctionCall() {
        const children = [
            this.terminal(
                "Identifier",
                this.consume(
                    "IDENTIFIER",
                    "Expected a function name."
                )
            ),
            this.punctuation(
                "LPAREN",
                "Expected '(' after function name."
            )
        ];

        if (!this.check("RPAREN")) {
            children.push(this.parseArgumentList());
        }

        children.push(
            this.punctuation(
                "RPAREN",
                "Expected ')' after function arguments."
            )
        );

        return this.node("FunctionCall", children);
    }

    parseArgumentList() {
        const children = [this.parseExpression()];

        while (this.match("COMMA")) {
            children.push(
                this.terminal("Punctuation", this.previous())
            );

            children.push(this.parseExpression());
        }

        return this.node("ArgumentList", children);
    }

    // =====================================
    // Token Helpers
    // =====================================

    checkKeyword(keyword) {
        return (
            this.check("KEYWORD") &&
            this.current().value === keyword
        );
    }

    matchKeyword(keyword) {
        if (this.checkKeyword(keyword)) {
            return this.advance();
        }

        return null;
    }

    consumeKeyword(keyword, message) {
        const token = this.matchKeyword(keyword);

        if (token) {
            return token;
        }

        this.throwError(message);
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }

        this.throwError(message);
    }

    check(type) {
        if (this.isAtEnd()) {
            return type === "EOF";
        }

        return this.current().type === type;
    }

    checkNext(type) {
        return this.tokens[this.position + 1]?.type === type;
    }

    advance() {
        if (!this.isAtEnd()) {
            this.position++;
        }

        return this.previous();
    }

    previous() {
        return this.tokens[this.position - 1];
    }

    current() {
        return this.tokens[this.position];
    }

    isAtEnd() {
        return (
            !this.current() ||
            this.current().type === "EOF"
        );
    }

    throwError(message) {
        const token = this.current();

        throw new SyntaxError(
            `Parser Error at line ${token?.line ?? 0}, ` +
            `column ${token?.column ?? 0}: ${message}`
        );
    }
}

module.exports = Parser;
