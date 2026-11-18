
"use strict";

// =====================================
// TOUHEDALANGUAGE - FRONTEND EDITOR
// =====================================

const API_URL = "/api/compiler";

// =====================================
// DOM ELEMENTS
// =====================================

const codeEditor = document.getElementById("codeEditor");

const runButton = document.getElementById("runButton");
const compileButton = document.getElementById("compileButton");
const clearButton = document.getElementById("clearButton");
const saveButton = document.getElementById("saveButton");
const openButton = document.getElementById("openButton");

const fileInput = document.getElementById("fileInput");
const autoSaveToggle = document.getElementById("autoSaveToggle");

const output = document.getElementById("output");
const outputStatus = document.getElementById("outputStatus");

const lineCount = document.getElementById("lineCount");
const editorStatus = document.getElementById("editorStatus");

const editorWorkspace = document.querySelector(".editor-workspace");
const errorDetails = document.getElementById("errorDetails");

const STORAGE_KEYS = {
    draft: "touheda_draft",
    saved: "touheda_saved_project",
    autoSave: "touheda_auto_save"
};

let editor = null;
let compilerResult = null;
let activeRequest = false;
let errorLineHandle = null;

// =====================================
// TOUHEDALANGUAGE CODEMIRROR MODE
// =====================================

function registerTouhedaMode() {
    if (typeof CodeMirror === "undefined") {
        console.warn(
            "CodeMirror was not loaded. Using the normal textarea editor."
        );
        return;
    }

    CodeMirror.defineMode("touheda", function () {

        const keywords = [
            "dhori",
            "dekhao",
            "jodi",
            "nahole",
            "loop",
            "function",
            "return"
        ];

        const constants = [
            "true",
            "false"
        ];

        const logicalOperators = [
            "and",
            "or",
            "not"
        ];

        return {
            token: function (stream) {

                // Whitespace
                if (stream.eatSpace()) {
                    return null;
                }

                // Comments
                if (stream.match("//")) {
                    stream.skipToEnd();
                    return "comment";
                }

                // Strings
                if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) {
                    return "string";
                }

                // Multi-word operators
                if (
                    stream.match(/\bboro\s+ba\s+soman\b/) ||
                    stream.match(/\bchoto\s+ba\s+soman\b/)
                ) {
                    return "operator";
                }

                // not =
                if (stream.match(/\bnot\s*=/)) {
                    return "operator";
                }

                // Numbers
                if (stream.match(/^-?\d+(?:\.\d+)?/)) {
                    return "number";
                }

                // Constants
                if (stream.match(/^(?:true|false)\b/)) {
                    return "atom";
                }

                // Keywords
                if (
                    stream.match(
                        /^(?:dhori|dekhao|jodi|nahole|loop|function|return)\b/
                    )
                ) {
                    return "keyword";
                }

                // Logical operators
                if (stream.match(/^(?:and|or|not)\b/)) {
                    return "operator";
                }

                // Single-word comparison operators
                if (stream.match(/^(?:boro|choto)\b/)) {
                    return "operator";
                }

                // Arithmetic and comparison symbols
                if (stream.match(/^(?:==|!=|>=|<=|[+\-*/%=<>])/)) {
                    return "operator";
                }

                // Function names
                if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/)) {
                    return "def";
                }

                // Identifiers
                if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
                    return "variable";
                }

                // Brackets and punctuation
                if (stream.match(/^[(){}.,]/)) {
                    return "bracket";
                }

                stream.next();
                return null;
            }
        };
    });
}

// =====================================
// EDITOR INITIALIZATION
// =====================================

function initializeEditor() {

    registerTouhedaMode();

    if (
        typeof CodeMirror !== "undefined" &&
        codeEditor
    ) {

        editor = CodeMirror.fromTextArea(codeEditor, {
            mode: "touheda",
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            autofocus: false,
            matchBrackets: true,
            viewportMargin: Infinity,
            extraKeys: {
                Tab: function (cm) {
                    cm.replaceSelection("    ");
                },

                "Ctrl-Enter": function () {
                    runCode();
                },

                "Cmd-Enter": function () {
                    runCode();
                },

                "Ctrl-S": function () {
                    saveProject();
                },

                "Cmd-S": function () {
                    saveProject();
                }
            }
        });

        editor.on("change", function () {
            handleEditorChange();
        });

    } else {
        editor = null;

        if (codeEditor) {
            codeEditor.addEventListener(
                "input",
                handleEditorChange
            );

            codeEditor.addEventListener(
                "keydown",
                handleTextareaTab
            );
        }
    }

    updateLineCount();
}

function getCode() {
    return editor
        ? editor.getValue()
        : codeEditor?.value || "";
}

function setCode(value) {

    if (editor) {
        editor.setValue(value);
        editor.clearHistory();
        editor.refresh();
    } else if (codeEditor) {
        codeEditor.value = value;
    }

    updateLineCount();
}

function updateLineCount() {

    const totalLines = getCode().split("\n").length;

    if (lineCount) {
        lineCount.textContent =
            `${totalLines} ${totalLines === 1 ? "line" : "lines"}`;
    }
}

// =====================================
// TEXTAREA FALLBACK TAB SUPPORT
// =====================================

function handleTextareaTab(event) {

    if (event.key !== "Tab") {
        return;
    }

    event.preventDefault();

    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;

    const currentValue = codeEditor.value;

    codeEditor.value =
        currentValue.substring(0, start) +
        "    " +
        currentValue.substring(end);

    codeEditor.selectionStart = start + 4;
    codeEditor.selectionEnd = start + 4;

    handleEditorChange();
}

// =====================================
// STATUS
// =====================================

function setStatus(message) {

    if (outputStatus) {
        outputStatus.textContent = message;
    }
}

function setEditorStatus(message) {

    if (editorStatus) {
        editorStatus.textContent = message;
    }
}

function clearOutputAnimation() {

    if (!output) {
        return;
    }

    output.classList.remove("updated");
}

function showOutput(message, type = "normal") {

    if (!output) {
        return;
    }

    clearOutputAnimation();

    output.textContent = message;

    if (type === "success") {
        output.style.color = "#087A42";
    } else if (type === "error") {
        output.style.color = "#B42332";
    } else {
        output.style.color = "";
    }

    // Restart the subtle output animation
    void output.offsetWidth;

    output.classList.add("updated");
}

function showError(message) {

    showOutput("Error: " + message, "error");

    setStatus("Error");
    setEditorStatus("Compilation or execution failed");
}

function showSuccess(message) {

    showOutput(message, "success");

    setStatus("Success");
}

function hideErrorDetails() {

    if (!errorDetails) {
        return;
    }

    errorDetails.textContent = "";
    errorDetails.hidden = true;
}

function showErrorDetails(message) {

    if (!errorDetails) {
        return;
    }

    errorDetails.textContent = message;
    errorDetails.hidden = false;
}

// =====================================
// ERROR LINE HIGHLIGHTING
// =====================================

function clearErrorHighlight() {

    if (!editor) {
        return;
    }

    if (errorLineHandle !== null) {

        editor.removeLineClass(
            errorLineHandle,
            "background",
            "cm-error-line"
        );

        editor.removeLineClass(
            errorLineHandle,
            "gutter",
            "cm-error-gutter"
        );

        errorLineHandle = null;
    }
}

function extractErrorLocation(message) {

    if (!message) {
        return null;
    }

    const patterns = [
        /\bline\s*[:#]?\s*(\d+)\s*[,;:]?\s*column\s*[:#]?\s*(\d+)/i,
        /\bline\s*[:#]?\s*(\d+)\s*[,;:]?\s*col(?:umn)?\s*[:#]?\s*(\d+)/i,
        /\((\d+)\s*[:,]\s*(\d+)\)/
    ];

    for (const pattern of patterns) {

        const match = message.match(pattern);

        if (match) {
            return {
                line: Number(match[1]),
                column: Number(match[2])
            };
        }
    }

    // Only accept a line-only location if explicitly stated.
    const lineMatch = message.match(
        /\bline\s*[:#]?\s*(\d+)\b/i
    );

    if (lineMatch) {
        return {
            line: Number(lineMatch[1]),
            column: null
        };
    }

    return null;
}

function highlightErrorLine(message) {

    clearErrorHighlight();

    const location = extractErrorLocation(message);

    if (!location || !editor) {
        return;
    }

    const lineIndex = location.line - 1;

    if (
        lineIndex < 0 ||
        lineIndex >= editor.lineCount()
    ) {
        return;
    }

    editor.addLineClass(
        lineIndex,
        "background",
        "cm-error-line"
    );

    editor.addLineClass(
        lineIndex,
        "gutter",
        "cm-error-gutter"
    );

    errorLineHandle = lineIndex;

    if (
        location.column !== null &&
        location.column > 0
    ) {

        const lineText = editor.getLine(lineIndex);

        const columnIndex = Math.min(
            location.column - 1,
            lineText.length
        );

        const endIndex = Math.min(
            columnIndex + 1,
            lineText.length
        );

        if (endIndex > columnIndex) {

            editor.markText(
                {
                    line: lineIndex,
                    ch: columnIndex
                },
                {
                    line: lineIndex,
                    ch: endIndex
                },
                {
                    className: "cm-error-token"
                }
            );
        }
    }

    editor.scrollIntoView(
        {
            line: lineIndex,
            ch: 0
        },
        100
    );
}

function handleCompilerError(message) {

    const errorMessage =
        message || "An unknown compiler error occurred.";

    showError(errorMessage);

    highlightErrorLine(errorMessage);

    const location = extractErrorLocation(errorMessage);

    if (location) {

        const locationText =
            location.column !== null
                ? `Line ${location.line}, Column ${location.column}`
                : `Line ${location.line}`;

        showErrorDetails(locationText);
    } else {
        hideErrorDetails();
    }
}

// =====================================
// AUTO SAVE
// =====================================

function saveDraft() {

    if (!autoSaveToggle?.checked) {
        return;
    }

    try {

        localStorage.setItem(
            STORAGE_KEYS.draft,
            getCode()
        );

        setEditorStatus("Draft saved automatically");

    } catch (error) {

        setEditorStatus("Auto Save unavailable");

        console.error("Auto Save Error:", error);
    }
}

function loadDraft() {

    try {

        const savedDraft = localStorage.getItem(
            STORAGE_KEYS.draft
        );

        if (savedDraft !== null) {
            setCode(savedDraft);
        }

        const autoSavePreference =
            localStorage.getItem(STORAGE_KEYS.autoSave);

        if (
            autoSavePreference !== null &&
            autoSaveToggle
        ) {
            autoSaveToggle.checked =
                autoSavePreference === "true";
        }

    } catch (error) {

        console.error("Draft Loading Error:", error);
    }
}

if (autoSaveToggle) {

    autoSaveToggle.addEventListener("change", () => {

        try {

            localStorage.setItem(
                STORAGE_KEYS.autoSave,
                String(autoSaveToggle.checked)
            );

            if (autoSaveToggle.checked) {

                saveDraft();

                setEditorStatus("Auto Save enabled");

            } else {

                setEditorStatus("Auto Save disabled");
            }

        } catch (error) {

            setEditorStatus("Could not update Auto Save");
        }
    });
}

// =====================================
// EDITOR CHANGE HANDLER
// =====================================

function handleEditorChange() {

    updateLineCount();

    saveDraft();

    clearErrorHighlight();

    hideErrorDetails();

    setEditorStatus("Editing...");
}

// =====================================
// API REQUEST
// =====================================

async function sendRequest(endpoint) {

    const sourceCode = getCode();

    if (!sourceCode.trim()) {

        showError("Please write some code first.");

        return null;
    }

    if (activeRequest) {
        return null;
    }

    activeRequest = true;

    setStatus("Processing...");
    setEditorStatus("Sending code to compiler...");

    if (editorWorkspace) {
        editorWorkspace.classList.add("loading");
    }

    if (runButton) {
        runButton.disabled = true;
    }

    if (compileButton) {
        compileButton.disabled = true;
    }

    try {

        const response = await fetch(
            `${API_URL}/${endpoint}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    sourceCode
                })
            }
        );

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The server returned an invalid response."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.error || "Compiler request failed."
            );
        }

        return data;

    } catch (error) {

        const message =
            error.message.includes("Failed to fetch")
                ? "Cannot connect to compiler server. Please start the backend server."
                : error.message;

        showError(message);

        return null;

    } finally {

        activeRequest = false;

        if (editorWorkspace) {
            editorWorkspace.classList.remove("loading");
        }

        if (runButton) {
            runButton.disabled = false;
        }

        if (compileButton) {
            compileButton.disabled = false;
        }
    }
}

// =====================================
// COMPILE CODE
// =====================================

async function compileCode() {

    clearErrorHighlight();
    hideErrorDetails();

    const data = await sendRequest("compile");

    if (!data) {
        return;
    }

    compilerResult = data;

    if (!data.success) {

        handleCompilerError(
            data.error || "Compilation failed."
        );

        return;
    }

    showSuccess("Compilation successful!");

    setEditorStatus("Compilation completed");
}

// =====================================
// RUN CODE
// =====================================

async function runCode() {

    clearErrorHighlight();
    hideErrorDetails();

    const data = await sendRequest("run");

    if (!data) {
        return;
    }

    if (!data.success) {

        handleCompilerError(
            data.error || "Program execution failed."
        );

        return;
    }

    const programOutput = Array.isArray(data.output)
        ? data.output.join("\n")
        : String(data.output ?? "");

    showSuccess(
        programOutput ||
        "(Program executed successfully with no output.)"
    );

    setEditorStatus("Program executed successfully");
}

// =====================================
// CLEAR EDITOR
// =====================================

function clearEditor() {

    const confirmed = confirm(
        "Are you sure you want to clear the editor?"
    );

    if (!confirmed) {
        return;
    }

    setCode("");

    clearErrorHighlight();
    hideErrorDetails();

    showOutput(
        "Your program output will appear here."
    );

    compilerResult = null;

    setStatus("Waiting");
    setEditorStatus("Editor cleared");

    saveDraft();
}


// =====================================
// SAVE PROJECT
// =====================================

async function saveProject() {

    const sourceCode = getCode();

    if (!sourceCode || !sourceCode.trim()) {
        alert("There is no code to save.");
        return;
    }

    // Save browser backup
    const project = {
        name: "Touheda Project",
        extension: ".tou",
        sourceCode: sourceCode,
        savedAt: new Date().toISOString()
    };

    try {

        localStorage.setItem(
            STORAGE_KEYS.saved,
            JSON.stringify(project)
        );

        localStorage.setItem(
            STORAGE_KEYS.draft,
            sourceCode
        );

    } catch (error) {

        console.error("Backup Error:", error);

        alert("Could not save browser backup: " + error.message);
        return;
    }

    // Detect mobile devices
    const isMobile = /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );

    try {

        // =====================================
        // PC FILE SAVE
        // =====================================

        if (window.showSaveFilePicker && !isMobile) {

            const fileHandle = await window.showSaveFilePicker({
                suggestedName: "TouhedaProject.tou",
                types: [
                    {
                        description: "TouhedaLanguage File",
                        accept: {
                            "text/plain": [".tou"]
                        }
                    }
                ]
            });

            const writable = await fileHandle.createWritable();

            await writable.write(sourceCode);
            await writable.close();

            setEditorStatus("Project saved successfully!");

            alert("Your TouhedaLanguage project has been saved!");

            return;
        }

        // =====================================
        // MOBILE / BROWSER DOWNLOAD
        // =====================================

        const blob = new Blob(
            [sourceCode],
            { type: "text/plain;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "TouhedaProject.tou";
        link.style.display = "none";

        document.body.appendChild(link);

        link.click();

        link.remove();

        // Keep URL available while browser starts download
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10000);

        setEditorStatus("Download started successfully!");

        alert(
            "Your TouhedaLanguage file download has started!\n\n" +
            "File name: TouhedaProject.tou\n\n" +
            "Check your Downloads folder."
        );

    } catch (error) {

        // User cancelled PC Save dialog
        if (error.name === "AbortError") {

            setEditorStatus("Save cancelled");

            return;
        }

        console.error("Save Project Error:", error);

        setEditorStatus("Browser backup saved");

        alert(
            "Your code is backed up in this browser.\n\n" +
            "File save error: " + error.message
        );
    }
}


// =====================================
// OPEN PROJECT FILE
// =====================================

function openProject() {

    if (fileInput) {
        fileInput.click();
    }
}

if (fileInput) {

    fileInput.addEventListener("change", event => {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const allowedExtensions = [
            ".tou",
            ".txt"
        ];

        const extension = file.name
            .substring(file.name.lastIndexOf("."))
            .toLowerCase();

        if (!allowedExtensions.includes(extension)) {

            alert(
                "Please select a .tou or .txt file."
            );

            fileInput.value = "";

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            setCode(
                String(reader.result ?? "")
            );

            clearErrorHighlight();
            hideErrorDetails();

            compilerResult = null;

            saveDraft();

            setEditorStatus(
                `Opened: ${file.name}`
            );

            showOutput(
                "File opened. Run or compile your program."
            );

            setStatus("Waiting");
        };

        reader.onerror = () => {

            alert(
                "Could not read the selected file."
            );
        };

        reader.readAsText(file);

        fileInput.value = "";
    });
}

// =====================================
// DOCUMENTATION NAVIGATION
// =====================================

const documentationButtons =
    document.querySelectorAll(".docs-link");

const documentationPages =
    document.querySelectorAll(".doc-page");

documentationButtons.forEach(button => {

    button.addEventListener("click", () => {

        const selectedDoc = button.dataset.doc;

        documentationButtons.forEach(item => {

            item.classList.toggle(
                "active",
                item === button
            );
        });

        documentationPages.forEach(page => {

            page.classList.toggle(
                "active",
                page.id === `doc-${selectedDoc}`
            );
        });
    });
});

// =====================================
// SAVE DOCUMENTATION CODE SAMPLES
// =====================================

document.querySelectorAll(
    ".save-sample-button"
).forEach(button => {

    button.addEventListener("click", () => {

        const sampleCode = button.dataset.saveCode;

        if (sampleCode === undefined) {
            return;
        }

        setCode(sampleCode);

        clearErrorHighlight();
        hideErrorDetails();

        saveDraft();

        setEditorStatus(
            "Documentation example loaded into My Code"
        );

        showOutput(
            "Example loaded. Click Run to execute it."
        );

        setStatus("Ready");

        const playground = document.getElementById("my-code");

        if (playground) {
            playground.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

// =====================================
// BUTTON EVENTS
// =====================================

if (runButton) {
    runButton.addEventListener("click", runCode);
}

if (compileButton) {
    compileButton.addEventListener("click", compileCode);
}

if (clearButton) {
    clearButton.addEventListener("click", clearEditor);
}

if (saveButton) {
    saveButton.addEventListener("click", saveProject);
}

if (openButton) {
    openButton.addEventListener("click", openProject);
}

// =====================================
// INITIALIZATION
// =====================================

initializeEditor();

loadDraft();

updateLineCount();

setStatus("Waiting");

setEditorStatus("Ready to code");
