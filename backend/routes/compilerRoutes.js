
const express = require("express");
const Compiler = require("../compiler/Compiler");
const Runtime = require("../compiler/Runtime");

const router = express.Router();

const compiler = new Compiler();
const runtime = new Runtime();

// POST /api/compiler/compile
// Compile TouhedaLanguage source code into JavaScript
router.post("/compile", (req, res) => {
    try {
        const { sourceCode } = req.body;

        if (typeof sourceCode !== "string" || !sourceCode.trim()) {
            return res.status(400).json({
                success: false,
                error: "Source code is required."
            });
        }

        const result = compiler.compile(sourceCode);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            preprocessedCode: result.preprocessedCode,
            tokens: result.tokens,
            parseTree: result.parseTree,
            ast: result.ast,
            javascript: result.javascript
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/compiler/run
// Compile and execute TouhedaLanguage source code
router.post("/run", (req, res) => {
    try {
        const { sourceCode } = req.body;

        if (typeof sourceCode !== "string" || !sourceCode.trim()) {
            return res.status(400).json({
                success: false,
                error: "Source code is required."
            });
        }

        const compilation = compiler.compile(sourceCode);

        if (!compilation.success) {
            return res.status(400).json({
                success: false,
                error: compilation.error
            });
        }

        const execution = runtime.execute(compilation.javascript);

        return res.status(200).json({
            success: execution.success,
            javascript: compilation.javascript,
            output: execution.output,
            error: execution.error
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
