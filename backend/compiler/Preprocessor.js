
/**
 * TouhedaLanguage - Preprocessor
 * Version: 1.0
 *
 * Responsibilities:
 * 1. Validate source code input.
 * 2. Remove single-line comments.
 * 3. Remove empty lines.
 * 4. Preserve meaningful line numbers.
 * 5. Prepare source code for the Lexer.
 */

class Preprocessor {
    preprocess(sourceCode) {
        if (typeof sourceCode !== "string") {
            throw new TypeError("Source code must be a string.");
        }

        const lines = sourceCode.split(/\r?\n/);
        const processedLines = [];

        for (let index = 0; index < lines.length; index++) {
            const originalLine = lines[index];
            const cleanedLine = this.removeComment(originalLine).trim();

            if (cleanedLine.length === 0) {
                continue;
            }

            processedLines.push({
                text: cleanedLine,
                line: index + 1
            });
        }

        return {
            code: processedLines.map(item => item.text).join("\n"),
            lines: processedLines
        };
    }

    removeComment(line) {
        let insideString = false;
        let quoteCharacter = null;
        let result = "";

        for (let index = 0; index < line.length; index++) {
            const character = line[index];

            if (
                (character === '"' || character === "'") &&
                (index === 0 || line[index - 1] !== "\\")
            ) {
                if (!insideString) {
                    insideString = true;
                    quoteCharacter = character;
                } else if (character === quoteCharacter) {
                    insideString = false;
                    quoteCharacter = null;
                }
            }

            if (
                !insideString &&
                character === "/" &&
                line[index + 1] === "/"
            ) {
                break;
            }

            result += character;
        }

        return result;
    }
}

module.exports = Preprocessor;
