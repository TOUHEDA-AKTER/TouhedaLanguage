
/**
 * TouhedaLanguage - Lexer / Tokenizer
 * Version: 1.0
 *
 * Converts source code into a sequence of tokens.
 */

class Lexer {
    constructor() {
        this.keywords = new Set([
            "dhori",
            "dekhao",
            "jodi",
            "nahole",
            "loop",
            "function",
            "return",
            "true",
            "false",
            "and",
            "or",
            "not"
        ]);

        this.wordOperators = {
            boro: "GREATER_THAN",
            choto: "LESS_THAN"
        };

        this.symbolOperators = {
            "+": "PLUS",
            "-": "MINUS",
            "*": "MULTIPLY",
            "/": "DIVIDE",
            "%": "MODULUS",
            "=": "ASSIGN",
            "(": "LPAREN",
            ")": "RPAREN",
            "{": "LBRACE",
            "}": "RBRACE",
            ",": "COMMA"
        };
    }

    tokenize(sourceCode) {
        if (typeof sourceCode !== "string") {
            throw new TypeError("Lexer input must be a string.");
        }

        this.source = sourceCode;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];

        while (!this.isAtEnd()) {
            const character = this.current();

            // Ignore whitespace
            if (
                character === " " ||
                character === "\t" ||
                character === "\r"
            ) {
                this.advance();
                continue;
            }

            // Handle new lines
            if (character === "\n") {
                this.advance();
                this.line++;
                this.column = 1;
                continue;
            }

            const tokenLine = this.line;
            const tokenColumn = this.column;

            // Number
            if (this.isDigit(character)) {
                this.readNumber(tokenLine, tokenColumn);
                continue;
            }

            // Double-quoted string
            if (character === '"') {
                this.readString(tokenLine, tokenColumn);
                continue;
            }

            // Identifier, keyword or word operator
            if (this.isLetter(character) || character === "_") {
                this.readWord(tokenLine, tokenColumn);
                continue;
            }

            // Not equal alias: !=
            if (character === "!") {
                this.advance();

                if (this.current() === "=") {
                    this.advance();

                    this.addToken(
                        "NOT_EQUAL",
                        "!=",
                        tokenLine,
                        tokenColumn
                    );

                    continue;
                }

                this.throwError(
                    "Unexpected character '!'.",
                    tokenLine,
                    tokenColumn
                );
            }

            // Symbol operators and punctuation
            if (this.symbolOperators[character]) {
                this.advance();

                // Equal comparison: ==
                if (character === "=" && this.current() === "=") {
                    this.advance();

                    this.addToken(
                        "EQUAL",
                        "==",
                        tokenLine,
                        tokenColumn
                    );
                } else {
                    this.addToken(
                        this.symbolOperators[character],
                        character,
                        tokenLine,
                        tokenColumn
                    );
                }

                continue;
            }

            this.throwError(
                `Unexpected character '${character}'.`,
                tokenLine,
                tokenColumn
            );
        }

        // End of file token
        this.tokens.push({
            type: "EOF",
            value: null,
            line: this.line,
            column: this.column
        });

        return this.tokens;
    }

    // Read integer and decimal numbers
    readNumber(line, column) {
        let number = "";

        while (this.isDigit(this.current())) {
            number += this.advance();
        }

        if (
            this.current() === "." &&
            this.isDigit(this.peek())
        ) {
            number += this.advance();

            while (this.isDigit(this.current())) {
                number += this.advance();
            }
        }

        this.addToken(
            "NUMBER",
            Number(number),
            line,
            column
        );
    }

    // Read double-quoted strings
    readString(line, column) {
        this.advance();

        let value = "";

        while (!this.isAtEnd() && this.current() !== '"') {
            if (this.current() === "\n") {
                this.throwError(
                    "String cannot contain an unescaped newline.",
                    line,
                    column
                );
            }

            if (this.current() === "\\") {
                this.advance();

                if (this.isAtEnd()) {
                    break;
                }

                const escaped = this.advance();

                const escapeMap = {
                    n: "\n",
                    t: "\t",
                    r: "\r",
                    "\\": "\\",
                    '"': '"'
                };

                value += escapeMap[escaped] ?? escaped;
                continue;
            }

            value += this.advance();
        }

        if (this.isAtEnd()) {
            this.throwError(
                "Unterminated string.",
                line,
                column
            );
        }

        this.advance();

        this.addToken(
            "STRING",
            value,
            line,
            column
        );
    }

    // Read a word from the source
    readWord(line, column) {
        let word = "";

        while (
            this.isLetter(this.current()) ||
            this.isDigit(this.current()) ||
            this.current() === "_"
        ) {
            word += this.advance();
        }

        // Check multi-word comparison operators first
        if (this.tryReadMultiWordOperator(word, line, column)) {
            return;
        }

        // Handle "not =" operator
        if (
            word === "not" &&
            (this.current() === " " || this.current() === "\t")
        ) {
            const savedPosition = this.position;
            const savedColumn = this.column;

            this.skipSpaces();

            if (
                this.current() === "=" &&
                this.peek() !== "="
            ) {
                this.advance();

                this.addToken(
                    "NOT_EQUAL",
                    "not =",
                    line,
                    column
                );

                return;
            }

            this.position = savedPosition;
            this.column = savedColumn;
        }

        // Single-word comparison operators
        if (this.wordOperators[word]) {
            this.addToken(
                this.wordOperators[word],
                word,
                line,
                column
            );

            return;
        }

        // Keywords
        if (this.keywords.has(word)) {
            this.addToken(
                "KEYWORD",
                word,
                line,
                column
            );

            return;
        }

        // Normal identifiers
        this.addToken(
            "IDENTIFIER",
            word,
            line,
            column
        );
    }

    // Recognize "boro ba soman" and "choto ba soman"
    tryReadMultiWordOperator(firstWord, line, column) {
        if (firstWord !== "boro" && firstWord !== "choto") {
            return false;
        }

        const savedPosition = this.position;
        const savedColumn = this.column;

        this.skipSpaces();

        const secondWord = this.readNextWord();

        if (secondWord !== "ba") {
            this.position = savedPosition;
            this.column = savedColumn;
            return false;
        }

        if (
            this.current() !== " " &&
            this.current() !== "\t"
        ) {
            this.position = savedPosition;
            this.column = savedColumn;
            return false;
        }

        this.skipSpaces();

        const thirdWord = this.readNextWord();

        if (thirdWord !== "soman") {
            this.position = savedPosition;
            this.column = savedColumn;
            return false;
        }

        const tokenType =
            firstWord === "boro"
                ? "GREATER_EQUAL"
                : "LESS_EQUAL";

        const operatorValue = `${firstWord} ba soman`;

        this.addToken(
            tokenType,
            operatorValue,
            line,
            column
        );

        return true;
    }

    // Read the next word without creating a token
    readNextWord() {
        let word = "";

        while (
            this.isLetter(this.current()) ||
            this.isDigit(this.current()) ||
            this.current() === "_"
        ) {
            word += this.advance();
        }

        return word;
    }

    // Skip spaces and tabs
    skipSpaces() {
        while (
            this.current() === " " ||
            this.current() === "\t"
        ) {
            this.advance();
        }
    }

    // Add token
    addToken(type, value, line, column) {
        this.tokens.push({
            type,
            value,
            line,
            column
        });
    }

    // Check digit
    isDigit(character) {
        return character >= "0" && character <= "9";
    }

    // Check English letter
    isLetter(character) {
        return (
            (character >= "a" && character <= "z") ||
            (character >= "A" && character <= "Z")
        );
    }

    // Current character
    current() {
        return this.source[this.position] ?? "\0";
    }

    // Next character
    peek() {
        return this.source[this.position + 1] ?? "\0";
    }

    // Move to next character
    advance() {
        const character = this.current();

        this.position++;
        this.column++;

        return character;
    }

    // Check end of source
    isAtEnd() {
        return this.position >= this.source.length;
    }

    // Display lexer errors
    throwError(message, line, column) {
        throw new SyntaxError(
            `Lexer Error at line ${line}, column ${column}: ${message}`
        );
    }
}

module.exports = Lexer;
