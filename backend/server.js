const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Prepwise backend is running!");
});

// Recipe recommendation route
app.post("/recommend-recipes", (req, res) => {
  const { ingredients } = req.body;

  // Basic validation
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({
      error: "Please provide an array of ingredients.",
    });
  }

  const scriptPath = path.join(
    __dirname,
    "..",
    "python_service",
    "recommender.py"
  );

  const pythonProcess = spawn("python3", [
    scriptPath,
    JSON.stringify(ingredients),
  ]);
  let pythonOutput = "";
  let pythonError = "";

  // collect stdout
  pythonProcess.stdout.on("data", (data) => {
    pythonOutput += data.toString();
  });

  // collect stderr
  pythonProcess.stderr.on("data", (data) => {
    pythonError += data.toString();
  });

  // when python finishes
  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Python process failed",
        details: pythonError,
      });
    }

    try {
      const result = JSON.parse(pythonOutput);

      return res.json({
        message: "Recipe recommendations generated successfully",
        recipes: result,
      });
    } catch (err) {
        return res.status(500).json({
          error: "Failed to parse Python output",
          rawOutput: pythonOutput,
        });
      }
    });
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});