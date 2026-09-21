const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 5001;

const recipeCache = new Map();

// Stateful Rate-Limiting Storage
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; //ms
const MAX_REQUESTS_PER_MINUTE = 15;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("Prepwise backend is running!");
});

// Recipe recommendation route
app.post("/recommend-recipes", (req, res) => {
  const { ingredients } = req.body;
  // Rate limiting
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const currentTime = Date.now();

  if (!ipRequestCounts.has(clientIp)) {
    ipRequestCounts.set(clientIp, { count: 1, lastReset: currentTime });
  } else {
    const tracker = ipRequestCounts.get(clientIp);
    
    // Reset tracker window if 1 minute has elapsed
    if (currentTime - tracker.lastReset > RATE_LIMIT_WINDOW) {
      tracker.count = 1;
      tracker.lastReset = currentTime;
    } else {
      tracker.count++;
    }
    
    // Enforce rate limit boundary
    if (tracker.count > MAX_REQUESTS_PER_MINUTE) {
      console.log(`[Rate Limit Blocked] Excess traffic from client IP: ${clientIp}`);
      return res.status(429).json({
        error: "Too many recipe generation requests. Please try again in a minute."
      });
    }
  }

  // Basic validation
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({
      error: "Please provide an array of ingredients.",
    });
  }

  if (ingredients.length === 0) {
    return res.status(400).json({
      error: "Ingredients list cannot be empty",
    });
  }

  const cacheKey = [...ingredients].sort().join(",").toLowerCase();
  
  // if (recipeCache.has(cacheKey)) {
  //   console.log(`[Cache Hit] Serving recipes from memory for: [${cacheKey}]`);
  //   return res.json({
  //     message: "Recipe recommendations retrieved from cache",
  //     recipes: recipeCache.get(cacheKey),
  //     cached: true
  //   });
  // }

  console.log(`[Cache Miss] Spawning Python process for: [${cacheKey}]`);

  const scriptPath = path.join(
    __dirname,
    "..",
    "python_service",
    "recommender.py"
  );

  let responded = false;
  const pythonProcess = spawn("python3", [
    scriptPath,
    JSON.stringify(ingredients),
  ]);
  const timeout = setTimeout(() => {
    pythonProcess.kill("SIGKILL");

    if (responded) return;
    responded = true;

    res.status(500).json({
      error: "Python process timed out",
    });
  }, 5000);

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
    clearTimeout(timeout);

    if (responded) return;
    responded = true;

    console.log(`[Python] Process closed with code: ${code}`);
    console.log(`[Python] Raw stdout length: ${pythonOutput.length}`);
    console.log(`[Python] Raw stdout: ${pythonOutput}`);
    
    if (pythonError) {
      console.log(`[Python] stderr: ${pythonError}`);
    }

    if (code !== 0) {
      return res.status(500).json({
        error: "Python process failed",
        details: pythonError,
      });
    }

    try {
      const cleanedOutput = pythonOutput.trim();
      console.log(`[Python] Cleaned output: ${cleanedOutput}`);

      const result = JSON.parse(cleanedOutput);

      console.log(`[Python] Parsed result type: ${Array.isArray(result) ? 'array' : typeof result}`);
      console.log(`[Python] Result length: ${result.length}`);
      
      // Log each recipe's structure
      result.forEach((recipe, idx) => {
        console.log(`Recipe ${idx + 1}: ${recipe.name}`);
        console.log(`  - instructions type: ${typeof recipe.instructions}`);
        console.log(`  - instructions is array: ${Array.isArray(recipe.instructions)}`);
        console.log(`  - instructions length: ${recipe.instructions?.length}`);
        console.log(`  - image: ${recipe.image || 'missing'}`);
      });

      recipeCache.set(cacheKey, result);

      return res.json({
        message: "Recipe recommendations generated successfully",
        recipes: result,
        cached: false
      });
    } catch (err) {
      console.error(`[Python] Parse error: ${err.message}`);
      console.error(`[Python] Failed to parse: ${pythonOutput}`);
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