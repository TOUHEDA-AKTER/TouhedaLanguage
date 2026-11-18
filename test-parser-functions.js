const Preprocessor = require("./backend/compiler/Preprocessor");
const Lexer = require("./backend/compiler/Lexer");
const Parser = require("./backend/compiler/Parser");

const source = `
function jog(a, b) {
    dhori result = a + b
    return(result)
}

loop(5) {
    dekhao("TouhedaLanguage cholche")
}

dhori total = jog(10, 20)
dekhao(total)
`;

const processed = new Preprocessor().preprocess(source);
const tokens = new Lexer().tokenize(processed.code);
const syntaxTree = new Parser(tokens).parse();

console.log(JSON.stringify(syntaxTree, null, 2));
