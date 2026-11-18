
const Preprocessor = require("./Preprocessor");
const Lexer = require("./Lexer");
const Parser = require("./Parser");
const ASTMapper = require("./ASTMapper");
const CodeGenerator = require("./CodeGenerator");

class Compiler {
    constructor() {
        this.preprocessor = new Preprocessor();
        this.lexer = new Lexer();
        this.parser = null;
        this.astMapper = new ASTMapper();
        this.codeGenerator = new CodeGenerator();
    }

    compile(sourceCode) {
        if (typeof sourceCode !== "string") {
            throw new TypeError("Source code must be a string.");
        }

        try {
            // Stage 1: Preprocessing
            const preprocessed = this.preprocessor.preprocess(sourceCode);

            // Stage 2: Lexical Analysis
            const tokens = this.lexer.tokenize(preprocessed.code);

            // Stage 3: Syntax Analysis
            this.parser = new Parser(tokens);
            const parseTree = this.parser.parse();

            // Stage 4: AST Mapping
            const ast = this.astMapper.map(parseTree);

            // Stage 5: JavaScript Code Generation
            const javascript = this.codeGenerator.generate(ast);

            return {
                success: true,
                preprocessedCode: preprocessed.code,
                tokens,
                parseTree,
                ast,
                javascript,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                preprocessedCode: null,
                tokens: null,
                parseTree: null,
                ast: null,
                javascript: null,
                error: error.message
            };
        }
    }
}

module.exports = Compiler;
