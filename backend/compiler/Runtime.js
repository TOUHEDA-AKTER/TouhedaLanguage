const vm = require("node:vm");

class Runtime {
    constructor(options = {}) {
        this.timeout = options.timeout || 1000;
        this.maxOutputLength = options.maxOutputLength || 10000;
    }

    execute(javascriptCode) {
        if (typeof javascriptCode !== "string") {
            throw new TypeError("JavaScript code must be a string.");
        }

        const output = [];

        const safeConsole = Object.freeze({
            log: (...args) => {
                const message = args
                    .map(value => this.formatValue(value))
                    .join(" ");

                const currentLength = output.join("\n").length;

                if (currentLength + message.length > this.maxOutputLength) {
                    throw new Error("Maximum output limit exceeded.");
                }

                output.push(message);
            }
        });

        const sandbox = {
            console: safeConsole
        };

        const context = vm.createContext(sandbox);

        try {
            const script = new vm.Script(javascriptCode, {
                filename: "touheda-generated.js"
            });

            script.runInContext(context, {
                timeout: this.timeout
            });

            return {
                success: true,
                output,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                output,
                error: error.message
            };
        }
    }

    formatValue(value) {
        if (typeof value === "string") return value;
        if (value === undefined) return "undefined";
        if (value === null) return "null";

        if (typeof value === "object") {
            try {
                return JSON.stringify(value);
            } catch {
                return "[Object]";
            }
        }

        return String(value);
    }
}

module.exports = Runtime;