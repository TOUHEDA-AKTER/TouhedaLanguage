const Preprocessor = require("./backend/compiler/Preprocessor");
const Lexer = require("./backend/compiler/Lexer");
const Parser = require("./backend/compiler/Parser");

const source = `
dhori age = 20

jodi(age boroSoman 18) {
    dekhao("Tumi adult")
} nahole {
    dekhao("Tumi minor")
}
`;

const preprocessor = new Preprocessor();
const lexer = new Lexer();

const processed = preprocessor.preprocess(source);
const tokens = lexer.tokenize(processed.code);

const parser = new Parser(tokens);
const syntaxTree = parser.parse();

console.log(JSON.stringify(syntaxTree, null, 2));
