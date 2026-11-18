const Lexer = require("./backend/compiler/Lexer");

const lexer = new Lexer();

const source = [
    "dhori age = 20",
    "jodi(age boroSoman 18) {",
    ' dekhao("Tumi adult")',
    "}"
].join("\n");

console.log(lexer.tokenize(source));
