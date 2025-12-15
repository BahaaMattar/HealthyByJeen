// ✅ Uses your short image names in /customization/assets/
const ASSETS_DIR = "/customization/assets/";

const imageMap = {
  base: "base.png",
  eggs: "eggs.png",
  eggs_cheese: "eggs_cheese.png",
  avocado: "avocado.png",
  tomato: "tomato.png",
  tomato_mustard: "tomato_mustard.png",
};

// Presets (your values)
const presets = {
  base:          { price: 5,  cal: 100, p: 10, c: 12,   f: 5 },
  eggs:          { price: 6,  cal: 200, p: 18, c: 15,   f: 8 },
  eggs_cheese:   { price: 8,  cal: 250, p: 22, c: 20.5, f: 10 },
  avocado:       { price: 10, cal: 312, p: 28, c: 20.5, f: 15 },
  tomato:        { price: 11, cal: 325, p: 28, c: 20.5, f: 18.5 },
  tomato_mustard:{ price: 10, cal: 548, p: 36, c: 26.5, f: 20.5 },
};

// ✅ SINGLE selection state (because you only exported 6 “final” images)
const state = {
  plate: "sandwich",
  bread: "high-protein",
  protein: "none",  // none | eggs | eggs_cheese
  veggies: "none",  // none | avocado | tomato
  sauce: "none",    // none | mustard
};

// DOM
const previewImg = document.getElementById("previewImg");
const totalPrice = document.getElementById("totalPrice");
const mCalories  = document.getElementById("mCalories");
const mProtein   = document.getElementById("mProtein");
const mCarbs     = document.getElementById("mCarbs");
const mFats      = document.getElementById("mFats");
const chipsEl    = document.getElementById("chips");
const custMsg    = document.getElementById("custMsg");

// --- map current state to one of your 6 images ---
function computeKey(){
  // tomato + mustard
  if (state.veggies === "tomato" && state.sauce === "mustard") return "tomato_mustard";

  // tomato
  if (state.veggies === "tomato") return "tomato";

  // avocado
  if (state.veggies === "avocado") return "avocado";

  // eggs + cottage (you exported this as eggs_cheese)
  if (state.protein === "eggs_cheese") return "eggs_cheese";

  // eggs
  if (state.protein === "eggs") return "eggs";

  return "base";
}

function labelFor(group, value){
  const map = {
    plate: {
      "sandwich":"Sandwich", "salad":"Salad", "shaker":"Shaker", "dessert":"Dessert"
    },
    bread: {
      "whole-wheat":"Whole wheat",
      "high-protein":"High Protein bread",
      "gluten-free":"Gluten Free",
      "low-carb-wrap":"Low Carb Wrap"
    },
    protein: {
      "eggs":"Eggs",
      "eggs_cheese":"Cottage Cheese", // shown as chip like Figma
      "none":""
    },
    veggies: {
      "avocado":"Avocado", "tomato":"Tomato", "none":""
    },
    sauce: {
      "mustard":"Mustard", "none":""
    }
  };
  return (map[group] && map[group][value] !== undefined) ? map[group][value] : value;
}

function clearChips(){
  chipsEl.innerHTML = "";
}

function addChip(group, value, onRemove){
  const chip = document.createElement("div");
  chip.className = "cz-chip";
  chip.innerHTML = `
    <span>${labelFor(group, value)}</span>
    <button type="button" aria-label="Remove">×</button>
  `;
  chip.querySelector("button").addEventListener("click", onRemove);
  chipsEl.appendChild(chip);
}

function buildChips(){
  clearChips();

  // bread always shown
  addChip("bread", state.bread, () => {
    state.bread = "high-protein";
    custMsg.textContent = "";
    render();
  });

  // protein chip
  if (state.protein === "eggs") {
    addChip("protein", "eggs", () => {
      state.protein = "none";
      custMsg.textContent = "";
      render();
    });
  }
  if (state.protein === "eggs_cheese") {
    // In your figma chips you show Eggs + Cottage Cheese as two chips sometimes,
    // but we only have ONE image, so we show Cottage Cheese chip only (or change to two if you want).
    addChip("protein", "eggs", () => {
      state.protein = "none";
      custMsg.textContent = "";
      render();
    });
    addChip("protein", "eggs_cheese", () => {
      state.protein = "eggs"; // removing cheese returns to eggs image
      custMsg.textContent = "";
      render();
    });
  }

  // veggies chip
  if (state.veggies !== "none") {
    addChip("veggies", state.veggies, () => {
      state.veggies = "none";
      // if you remove tomato and mustard was selected, remove mustard too
      if (state.sauce === "mustard") state.sauce = "none";
      custMsg.textContent = "";
      render();
    });
  }

  // sauce chip
  if (state.sauce !== "none") {
    addChip("sauce", state.sauce, () => {
      state.sauce = "none";
      custMsg.textContent = "";
      render();
    });
  }
}

function render(){
  const key = computeKey();

  previewImg.src = ASSETS_DIR + (imageMap[key] || imageMap.base);

  const t = presets[key] || presets.base;
  totalPrice.textContent = `${t.price} $`;
  mCalories.textContent  = t.cal;
  mProtein.textContent   = t.p;
  mCarbs.textContent     = t.c;
  mFats.textContent      = t.f;

  buildChips();
}

// --- Dropdown open/close ---
function closeAllDropdowns(){
  document.querySelectorAll(".cz-dd.open").forEach(dd => dd.classList.remove("open"));
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".cz-dd")) closeAllDropdowns();
});

document.querySelectorAll(".cz-dd-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dd = btn.closest(".cz-dd");
    const wasOpen = dd.classList.contains("open");
    closeAllDropdowns();
    if (!wasOpen) dd.classList.add("open");
  });
});

// handle option selection (SINGLE SELECT)
document.querySelectorAll(".cz-dd-menu button").forEach(opt => {
  opt.addEventListener("click", () => {
    const group = opt.dataset.group;
    const value = opt.dataset.value;

    if (group === "plate") state.plate = value;

    if (group === "bread") state.bread = value;

    if (group === "protein") {
      // map "cottage-cheese" click to eggs_cheese image (since that's what you exported)
      if (value === "eggs") state.protein = "eggs";
      if (value === "cottage-cheese") state.protein = "eggs_cheese";
    }

    if (group === "veggies") state.veggies = value;

    if (group === "sauce") {
      // mustard only makes sense with tomato_mustard image, but allow selecting it anyway
      state.sauce = value;
    }

    closeAllDropdowns();
    custMsg.textContent = "";
    render();
  });
});

// Add to cart
document.getElementById("addToCartBtn").addEventListener("click", () => {
  const key = computeKey();
  const item = {
    name: "Usual Sando",
    key,
    selections: { ...state },
    preview: ASSETS_DIR + (imageMap[key] || imageMap.base),
    totals: presets[key] || presets.base,
  };

  const CART_KEY = "jeen_cart_v1";
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  cart.push(item);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  custMsg.textContent = "Added to cart!";
});

render();
