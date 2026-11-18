const Lexer = require("./backend/compiler/Lexer");

const lexer = new Lexer();

console.log(lexer.tokenize("age not = 18"));
