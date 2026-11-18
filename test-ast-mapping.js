const Preprocessor = require("./backend/compiler/Preprocessor");
const Lexer = require("./backend/compiler/Lexer");
const Parser = require("./backend/compiler/Parser");
const ParseTree = require("./backend/compiler/ParseTree");
const ASTMapper = require("./backend/compiler/ASTMapper");

const source = `
dhori age = 20

function jog(a, b) {
    return(a + b)
}

jodi(age boro ba soman 18) {
    dekhao("Tumi adult")
} nahole {
    dekhao("Tumi minor")
}

loop(3) {
    dekhao("TouhedaLanguage cholche")
}

dhori total = jog(10, 20)
dekhao(total)
`;

const processed = new Preprocessor().preprocess(source);
const tokens = new Lexer().tokenize(processed.code);

// Parsing
const parserOutput = new Parser(tokens).parse();

// Parse Tree
const parseTree = new ParseTree(parserOutput);

// AST Mapping
const mapper = new ASTMapper();
const ast = mapper.map(parseTree);

console.log("\n========== PARSE TREE ==========\n");
console.log(parseTree.toString());

console.log("\n========== ABSTRACT SYNTAX TREE ==========\n");
console.log(JSON.stringify(ast, null, 2));

console.log("\n========== TEST SUMMARY ==========\n");
console.log("Parse Tree:", parseTree.getRoot().type);
console.log("AST:", ast.type);
console.log("Total AST statements:", ast.body.length);
