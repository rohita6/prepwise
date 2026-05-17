console.log("Frontend script loaded");
const input = document.getElementById("ingredientInput");
const suggestionsBox = document.getElementById("suggestions");
const tagsContainer = document.getElementById("tags");
const generateBtn = document.getElementById("generateBtn");
const recipeResults = document.getElementById("recipeResults");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

const ingredientsList = [
  "eggs",
  "rice",
  "onion",
  "garlic",
  "tomato",
  "cheese",
  "milk",
  "butter",
  "bread",
  "chicken"
];

let selectedIngredients = [];

input.addEventListener("input", () => {
  const value = input.value.toLowerCase().trim();

  suggestionsBox.innerHTML = "";

  if (value === "") return;

  const filtered = ingredientsList.filter(item =>
    item.startsWith(value) && !selectedIngredients.includes(item)
  );

  filtered.forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action";
    li.textContent = formatIngredient(item);

    li.addEventListener("click", () => {
      addIngredient(item);
      input.value = "";
      suggestionsBox.innerHTML = "";
      input.focus();
    });

    suggestionsBox.appendChild(li);
  });
});
function formatIngredient(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
function addIngredient(ingredient) {
  if (selectedIngredients.includes(ingredient)) return;

  selectedIngredients.push(ingredient);
  renderTags();
}
function renderTags() {
  tagsContainer.innerHTML = "";

  selectedIngredients.forEach(item => {
    const tag = document.createElement("span");
    tag.className = "badge green-tag p-2 d-flex align-items-center gap-2";
    tag.style.cursor = "default";

    const text = document.createElement("span");
    text.textContent = formatIngredient(item);

    const removeBtn = document.createElement("span");
    removeBtn.textContent = " ×";
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("mouseover", () => {
        removeBtn.style.opacity = "0.7";
    });

    removeBtn.addEventListener("mouseout", () => {
        removeBtn.style.opacity = "1";
    });

    removeBtn.addEventListener("click", () => {
      selectedIngredients = selectedIngredients.filter(i => i !== item);
      renderTags();
    });

    tag.appendChild(text);
    tag.appendChild(removeBtn);
    tagsContainer.appendChild(tag);
  });
}

generateBtn.addEventListener("click", async () => {
  btnText.textContent = "Generating...";
  btnSpinner.classList.remove("d-none");
  generateBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:5001/recommend-recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ingredients: selectedIngredients
      })
    });

    const data = await response.json();

    const recipes = data.recipes || [];

    const filteredRecipes = recipes.filter(
      recipe => recipe.matchScore > 0
    );

    recipeResults.innerHTML = "";

    if (filteredRecipes.length === 0) {
      recipeResults.innerHTML = `
        <p class="text-center text-muted mt-3">
          No strong matches found. Try adding more ingredients.
        </p>
      `;
      return;
    }

    filteredRecipes.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "card mt-3 p-3 shadow-sm";

      card.innerHTML = `
        <h5>${recipe.name}</h5>
        <p>Match Score: ${recipe.matchScore}%</p>
        <p>Missing: ${recipe.missingIngredients.join(", ")}</p>
      `;

      recipeResults.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  } finally {
    // RESET BUTTON STATE
    btnText.innerHTML = `<i class="bi bi-stars me-2"></i>Generate Recipes`;
    btnSpinner.classList.add("d-none");
    generateBtn.disabled = false;
  }
});