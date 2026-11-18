
const express = require("express");
const cors = require("cors");
const path = require("path");

const compilerRoutes = require("./backend/routes/compilerRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve Frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// API Home
app.get("/api", (req, res) => {
    res.json({
        message: "Welcome to TouhedaLanguage Compiler API",
        status: "Server is running"
    });
});

// Compiler API Routes
app.use("/api/compiler", compilerRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found."
    });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error("Server Error:", error.message);

    res.status(500).json({
        success: false,
        error: "Internal server error."
    });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log("====================================");
    console.log(" TouhedaLanguage Compiler Server");
    console.log("====================================");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Playground: http://localhost:3000");
    console.log("Compiler API: /api/compiler");
    console.log("====================================");
});