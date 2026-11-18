const Lexer = require("./backend/compiler/Lexer");

const lexer = new Lexer();

const source = `
dhori age = 20
jodi(age boro ba soman 18) {
    dekhao("Tumi adult")
}
jodi(age choto ba soman 17) {
    dekhao("Tumi minor")
}
`;

console.log(lexer.tokenize(source));
