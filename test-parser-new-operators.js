const Preprocessor = require("./backend/compiler/Preprocessor");
const Lexer = require("./backend/compiler/Lexer");
const Parser = require("./backend/compiler/Parser");

const source = `
dhori age = 20

jodi(age boro ba soman 18) {
    dekhao("Tumi adult")
} nahole {
    dekhao("Tumi minor")
}
`;

const processed = new Preprocessor().preprocess(source);
const tokens = new Lexer().tokenize(processed.code);
const syntaxTree = new Parser(tokens).parse();

console.log(JSON.stringify(syntaxTree, null, 2));
