import json

# Temporary test input
user_ingredients = {"egg", "rice", "onion"}

with open("recipes.json", "r") as file:
    recipes = json.load(file)

results = []

for recipe in recipes:
    recipe_ingredients = set(recipe["ingredients"])
    matched = user_ingredients.intersection(recipe_ingredients)
    missing = recipe_ingredients - user_ingredients
    score = int((len(matched) / len(recipe_ingredients)) * 100)

    results.append({
        "name": recipe["name"],
        "matchScore": score,
        "missingIngredients": list(missing)
    })

results.sort(key=lambda recipe: recipe["matchScore"], reverse=True)

print(json.dumps(results, indent=2))