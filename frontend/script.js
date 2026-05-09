console.log("Frontend script loaded");
const input = document.getElementById("ingredientInput");
const suggestionsBox = document.getElementById("suggestions");
const tagsContainer = document.getElementById("tags");

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
    tag.className = "badge bg-primary p-2 d-flex align-items-center gap-2";
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