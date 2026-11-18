
/**
 * TouhedaLanguage - Concrete Parse Tree
 * Version: 1.0
 *
 * Stores grammar-based syntactic structure.
 */

class ParseTree {
    constructor(root) {
        if (!root || typeof root !== "object") {
            throw new TypeError("A valid Parse Tree root is required.");
        }

        this.root = root;
    }

    getRoot() {
        return this.root;
    }

    toJSON() {
        return this.root;
    }

    toString() {
        return JSON.stringify(this.root, null, 2);
    }

    static createNode(type, children = [], value = null) {
        if (typeof type !== "string" || !type.trim()) {
            throw new TypeError("Parse Tree node type must be a string.");
        }

        if (!Array.isArray(children)) {
            throw new TypeError("Parse Tree children must be an array.");
        }

        const node = {
            type,
            children
        };

        if (value !== null) {
            node.value = value;
        }

        return node;
    }

    static createTerminal(type, value) {
        return {
            type,
            value,
            children: []
        };
    }
}

module.exports = ParseTree;
