const ParseTree = require("./backend/compiler/ParseTree");

const sampleTree = {
    type: "Program",
    body: [
        {
            type: "PrintStatement",
            expression: {
                type: "Literal",
                value: "Hello TouhedaLanguage"
            }
        }
    ]
};

const tree = new ParseTree(sampleTree);

console.log("Root type:", tree.getRoot().type);
console.log("Parse Tree:");
console.log(tree.toString());
