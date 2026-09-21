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
  "chicken",
  "paneer",
  "ginger",
  "chilli",
  "soy sauce"
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

// Fixed: Single instance of the event listener with cache-busting timestamp enabled
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
    // Appended timestamp cache-buster directly to prevent local browser freeze cycles
    const response = await fetch(`https://prepwise-backend-943b.onrender.com/recommend-recipes?t=${Date.now()}`, {
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
    const filteredRecipes = recipes.filter(recipe => recipe.matchScore > 0);

    recipeResults.innerHTML = "";
    recipeResults.className = "d-flex flex-row flex-nowrap overflow-x-auto gap-3 mt-5 pb-3 justify-content-start";

    if (filteredRecipes.length === 0) {
      recipeResults.className = "mt-5 text-center";
      recipeResults.innerHTML = `
        <p class="text-muted">
          No strong matches found. Try adding more ingredients.
        </p>
      `;
      return;
    }

    filteredRecipes.forEach(recipe => {
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "flex-shrink-0";
      cardWrapper.style.width = "18rem";

      cardWrapper.innerHTML = `
        <div class="card h-100 p-3 shadow-sm text-start" style="cursor: pointer;">
          <h5 class="card-title text-success fw-bold">${recipe.name}</h5>
          <h6 class="card-subtitle mb-2 text-muted">Match Score: ${recipe.matchScore}%</h6>
          <p class="card-text small">
            <strong>Missing:</strong> ${recipe.missingIngredients.length > 0 ? recipe.missingIngredients.join(", ") : "None!"}
          </p>
        </div>
      `;

      cardWrapper.addEventListener("click", () => {
        document.getElementById("modalRecipeName").textContent = recipe.name;
        
        if (recipe.image && recipe.image.trim() !== "") {
          document.getElementById("modalRecipeImg").src = recipe.image;
        } else if (recipe.name === "Egg Fried Rice") {
          document.getElementById("modalRecipeImg").src = "media/egg_fried_rice.png";
        } else {
          document.getElementById("modalRecipeImg").src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop";
        }
        
        const ingredientsList = document.getElementById("modalRecipeIngredients");
        const stepsList = document.getElementById("modalRecipeSteps");
        
        ingredientsList.innerHTML = "";
        stepsList.innerHTML = "";

        if (recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.forEach(ing => {
            const li = document.createElement("li");
            li.className = "list-group-item border-0 px-0 py-1 text-muted small";
            li.textContent = formatIngredient(ing);
            ingredientsList.appendChild(li);
          });
        } else {
          ingredientsList.innerHTML = `<li class="list-group-item border-0 px-0 py-1 text-muted small">Check cooking steps</li>`;
        }

        if (recipe.instructions && recipe.instructions.length > 0) {
          recipe.instructions.forEach(step => {
            const li = document.createElement("li");
            li.className = "list-group-item border-0 px-0 py-2 text-muted small";
            li.textContent = step;
            stepsList.appendChild(li);
          });
        } else {
          stepsList.innerHTML = `<li class="list-group-item border-0 px-0 py-1 text-muted small italic">No specific steps provided yet.</li>`;
        }
        
        const myModal = new bootstrap.Modal(document.getElementById('recipeModal'));
        myModal.show();
      });

      recipeResults.appendChild(cardWrapper);
    });

  } catch (err) {
    console.error(err);
    recipeResults.className = "mt-5 text-center text-danger";
    recipeResults.innerHTML = `<p>Error loading recipes. Please try again later.</p>`;
  } finally {
    btnText.innerHTML = `<i class="bi bi-stars me-2"></i>Generate Recipes`;
    btnSpinner.classList.add("d-none");
    generateBtn.disabled = false;
  }
});