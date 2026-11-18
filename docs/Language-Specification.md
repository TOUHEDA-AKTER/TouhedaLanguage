
# TouhedaLanguage - Language Specification

**Version:** 1.0  
**Language Type:** Beginner-Friendly Programming Language  
**Backend:** JavaScript (Node.js)

## 1. Introduction

TouhedaLanguage is a beginner-friendly programming language designed to make programming simple and easy to understand.

The language uses simple keywords, familiar operators, and a clean syntax. It is implemented using a custom compiler written in JavaScript.

## 2. Language Design Goals

- Easy to learn and understand.
- Simple and readable syntax.
- No semicolons required.
- Automatic type handling.
- Support for variables, conditions, loops, and functions.
- Automatic translation into JavaScript.
- Display compiler phases for educational purposes.

## 3. Keywords

| Purpose | Keyword |
|---|---|
| Variable Declaration | `dhori` |
| Output | `dekhao` |
| If Condition | `jodi` |
| Else Condition | `nahole` |
| Loop | `loop` |
| Function | `function` |
| Return | `return` |
| True | `true` |
| False | `false` |
| Logical AND | `and` |
| Logical OR | `or` |
| Logical NOT | `not` |

## 4. Operators

### Arithmetic Operators

| Operation | Operator |
|---|---|
| Addition | `+` |
| Subtraction | `-` |
| Multiplication | `*` |
| Division | `/` |
| Modulus | `%` |

### Comparison Operators

| Operation | Operator |
|---|---|
| Assignment | `=` |
| Equal | `==` |
| Not Equal | `not =` |
| Greater Than | `boro` |
| Less Than | `choto` |
| Greater or Equal | `boro ba soman` |
| Less or Equal | `choto ba soman` |

## 5. Syntax Rules

1. Semicolons are not required.
2. Parentheses `()` are supported.
3. Curly braces `{}` define code blocks.
4. Double quotation marks are used for string values.
5. Each statement is written on a separate line.
6. Variables do not require explicit data type declarations.
7. Keywords are case-sensitive.
8. Whitespace and indentation are handled by the parser.
9. Comments will use the `//` symbol.

## 6. Variable Declaration

Variables are declared using the `dhori` keyword.

Example:

```text
dhori name = "Touheda"
dhori age = 20
dhori result = true
```

## 7. Output Statement

The `dekhao` keyword displays output.

Example:

```text
dekhao("Hello Touheda")
dekhao(100)
```

## 8. Conditional Statements

The `jodi` keyword represents an if condition.

The `nahole` keyword represents an else condition.

Example:

```text
dhori age = 20

jodi(age boro 18) {
    dekhao("Tumi adult")
} nahole {
    dekhao("Tumi minor")
}
```

## 9. Loop Statement

The `loop` keyword is used to repeat statements.

Example:

```text
loop(5) {
    dekhao("Hello Touheda")
}
```

## 10. Function Declaration

Functions are declared using the `function` keyword.

Example:

```text
function jog(a, b) {
    return(a + b)
}

dhori result = jog(10, 20)
dekhao(result)
```

## 11. Logical Operations

TouhedaLanguage supports:

- `and`
- `or`
- `not`
- `true`
- `false`

Example:

```text
dhori age = 20
dhori hasID = true

jodi(age boro 18 and hasID == true) {
    dekhao("Tumi apply korte parbe")
}
```

## 12. Compiler Architecture

TouhedaLanguage uses the following compilation pipeline:

1. Source Code Input
2. Preprocessor
3. Lexer / Tokenizer
4. Parser
5. Parse Tree Generation
6. Abstract Syntax Tree (AST) Mapping
7. JavaScript Code Generation
8. JavaScript Engine Execution
9. Output Display

## 13. Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js |
| Backend Framework | Express.js |
| Compiler | Custom JavaScript Implementation |
| Runtime | Node.js V8 |
| Code Editor | CodeMirror (planned) |

## 14. Project Objective

The main objective of TouhedaLanguage is to design and implement a simple programming language and demonstrate the internal working of a compiler through practical implementation.



## 15. Formal Grammar (EBNF)

The following grammar defines the syntax of TouhedaLanguage.

### 15.1 Program Structure

Program          = { Statement } ;

Statement        = VariableDeclaration
                 | PrintStatement
                 | IfStatement
                 | LoopStatement
                 | FunctionDeclaration
                 | ReturnStatement
                 | ExpressionStatement ;

### 15.2 Declarations and Statements

VariableDeclaration = "dhori", Identifier, "=", Expression ;

PrintStatement      = "dekhao", "(", Expression, ")" ;

IfStatement         = "jodi", "(", Expression, ")",
                      Block,
                      [ "nahole", Block ] ;

LoopStatement       = "loop", "(", Expression, ")", Block ;

FunctionDeclaration = "function", Identifier, "(",
                      [ ParameterList ], ")", Block ;

ParameterList       = Identifier, { ",", Identifier } ;

ReturnStatement     = "return", "(", Expression, ")" ;

ExpressionStatement = FunctionCall ;

Block               = "{", { Statement }, "}" ;

### 15.3 Expressions

Expression       = LogicalOr ;

LogicalOr        = LogicalAnd, { "or", LogicalAnd } ;

LogicalAnd       = Equality, { "and", Equality } ;

Equality         = Comparison,
                   { ("==" | "not ="), Comparison } ;

Comparison       = Addition,
                   { ("boro" | "choto" |
                      "boro ba soman" |
                      "choto ba soman"), Addition } ;

Addition         = Multiplication,
                   { ("+" | "-"), Multiplication } ;

Multiplication   = Unary,
                   { ("*" | "/" | "%"), Unary } ;

Unary            = ("not" | "-"), Unary
                 | Primary ;

Primary          = Number
                 | String
                 | "true"
                 | "false"
                 | Identifier
                 | FunctionCall
                 | "(", Expression, ")" ;

FunctionCall     = Identifier, "(",
                   [ ArgumentList ], ")" ;

ArgumentList     = Expression, { ",", Expression } ;

### 15.4 Lexical Elements

Identifier       = Letter, { Letter | Digit | "_" } ;

Number           = Digit, { Digit } ;

String           = '"', { Character }, '"' ;

### 15.5 Whitespace and Comments

Whitespace       = Space | Tab | NewLine ;

Comment          = "//", { Character } ;



