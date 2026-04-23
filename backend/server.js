const express = require("express");
const cors = require("cors");

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

  //replace with a call to recommender.py
  const recipes = [
    {
      name: "Egg Fried Rice",
      matchScore: 92,
      missingIngredients: ["soy sauce"],
    },
    {
      name: "Veggie Omelette",
      matchScore: 78,
      missingIngredients: ["cheese"],
    },
    {
      name: "Onion Rice Bowl",
      matchScore: 65,
      missingIngredients: ["garlic"],
    },
  ];

  res.json({
    message: "Recipe recommendations generated successfully.",
    inputIngredients: ingredients,
    recipes: recipes,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});