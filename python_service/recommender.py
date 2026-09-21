import json
import sys
import os

if len(sys.argv) < 2:
    print(json.dumps({"error": "No ingredients provided"}))
    sys.exit(1)

# Read ingredients from Node
user_ingredients = set(json.loads(sys.argv[1]))

file_path = os.path.join(os.path.dirname(__file__), "recipes.json")

# Load recipes
with open(file_path, "r") as file:
    recipes = json.load(file)

results = []

for recipe in recipes:
    recipe_ingredients = set(recipe["ingredients"])
    matched = user_ingredients.intersection(recipe_ingredients)
    missing = recipe_ingredients - user_ingredients
    score = int((len(matched) / len(recipe_ingredients)) * 100)
    
    if score > 20:
        results.append({
            "name": recipe.get("name", "Untitled Recipe"),
            "matchScore": score,
            "missingIngredients": list(missing),
            "image": recipe.get("image", ""),
            "instructions": recipe.get("instructions", []),
            "ingredients": recipe.get("ingredients", [])
        })

results.sort(key=lambda recipe: recipe["matchScore"], reverse=True)

top_results = results[:5]

print(json.dumps(top_results, indent=2))