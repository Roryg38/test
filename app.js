(function () {
  "use strict";

  const STORAGE_KEY = "fernFoundPlants";
  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // The dashboard still works when browser storage is unavailable.
      }
    }
  };

  function toDateInputValue(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function daysAgoDate(daysAgo) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return toDateInputValue(date);
  }

  function dateFromInput(value) {
    const parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12);
  }

  function daysUntilWatering(plant) {
    const dueDate = dateFromInput(plant.lastWatered);
    dueDate.setDate(dueDate.getDate() + Number(plant.intervalDays));
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Math.round((dueDate - today) / 86400000);
  }

  function formatDate(value) {
    return dateFromInput(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function makeStarterGarden() {
    return STARTER_PLANTS.map(function (plant) {
      return {
        id: plant.id,
        name: plant.name,
        species: plant.species,
        location: plant.location,
        intervalDays: plant.intervalDays,
        lastWatered: daysAgoDate(plant.daysSinceWatered)
      };
    });
  }

  let plants = storage.get(STORAGE_KEY, null);
  if (!Array.isArray(plants)) plants = makeStarterGarden();
  let activeFilter = "all";
  let toastTimer;

  const plantList = document.getElementById("plant-list");
  const emptyState = document.getElementById("empty-state");
  const plantDialog = document.getElementById("plant-dialog");
  const plantForm = document.getElementById("plant-form");
  const toast = document.getElementById("toast");

  document.title = STARTUP.name + " | Plant care";
  document.getElementById("tagline").textContent = STARTUP.tagline;
  document.getElementById("pitch").textContent = STARTUP.pitch;
  document.querySelector(".section-heading .eyebrow").textContent = new Date().toLocaleDateString(undefined, { weekday: "long" }) + ", in the garden";

  function savePlants() {
    storage.set(STORAGE_KEY, plants);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function sortByPriority(list) {
    return list.slice().sort(function (first, second) {
      const urgency = daysUntilWatering(first) - daysUntilWatering(second);
      return urgency || Number(first.intervalDays) - Number(second.intervalDays);
    });
  }

  function statusFor(plant) {
    const daysLeft = daysUntilWatering(plant);
    if (daysLeft < 0) return { text: "Overdue by " + Math.abs(daysLeft) + (Math.abs(daysLeft) === 1 ? " day" : " days"), className: "overdue" };
    if (daysLeft === 0) return { text: "Due today", className: "today" };
    return { text: "Due in " + daysLeft + (daysLeft === 1 ? " day" : " days"), className: "upcoming" };
  }

  function makePlantRow(plant, index) {
    const row = document.createElement("article");
    const daysLeft = daysUntilWatering(plant);
    row.className = "plant-row" + (daysLeft < 0 ? " is-overdue" : daysLeft === 0 ? " is-due" : "");
    row.style.animationDelay = Math.min(index * 45, 250) + "ms";

    const name = document.createElement("div");
    name.className = "plant-name";
    const title = document.createElement("h3");
    title.textContent = plant.name;
    const species = document.createElement("p");
    species.textContent = plant.species || "Plant details not added";
    name.append(title, species);

    const location = document.createElement("div");
    location.className = "plant-detail";
    const locationLabel = document.createElement("span");
    locationLabel.textContent = "HOME SPOT";
    const locationValue = document.createElement("strong");
    locationValue.textContent = plant.location || "Not set";
    location.append(locationLabel, locationValue);

    const routine = document.createElement("div");
    routine.className = "plant-detail";
    const routineLabel = document.createElement("span");
    routineLabel.textContent = "WATER EVERY";
    const routineValue = document.createElement("strong");
    routineValue.textContent = plant.intervalDays + (Number(plant.intervalDays) === 1 ? " day" : " days");
    routine.append(routineLabel, routineValue);

    const status = document.createElement("span");
    const careStatus = statusFor(plant);
    status.className = "plant-status " + careStatus.className;
    status.textContent = careStatus.text;

    const waterButton = document.createElement("button");
    waterButton.type = "button";
    waterButton.className = "button secondary water-button";
    waterButton.textContent = "Watered today";
    waterButton.setAttribute("aria-label", "Mark " + plant.name + " as watered today");
    waterButton.addEventListener("click", function () {
      plant.lastWatered = toDateInputValue(new Date());
      savePlants();
      renderPlants();
      showToast(plant.name + " marked as watered.");
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "×";
    removeButton.title = "Remove " + plant.name;
    removeButton.setAttribute("aria-label", "Remove " + plant.name);
    removeButton.addEventListener("click", function () {
      if (!window.confirm("Remove " + plant.name + " from your garden?")) return;
      plants = plants.filter(function (savedPlant) { return savedPlant.id !== plant.id; });
      savePlants();
      renderPlants();
      showToast(plant.name + " removed from your garden.");
    });

    row.append(name, location, routine, status, waterButton, removeButton);
    return row;
  }

  function renderStats(orderedPlants) {
    const duePlants = orderedPlants.filter(function (plant) { return daysUntilWatering(plant) <= 0; });
    document.getElementById("due-count").textContent = duePlants.length;
    document.getElementById("due-caption").textContent = duePlants.length === 1 ? "plant ready for a drink" : "plants ready for a drink";
    document.getElementById("plant-count").textContent = plants.length;

    const nextPlant = orderedPlants[0];
    document.getElementById("next-plant").textContent = nextPlant ? nextPlant.name : "—";
    document.getElementById("next-caption").textContent = nextPlant
      ? statusFor(nextPlant).text
      : "Your garden is all caught up";
  }

  function renderPlants() {
    const orderedPlants = sortByPriority(plants);
    renderStats(orderedPlants);
    emptyState.hidden = plants.length > 0;
    plantList.replaceChildren();

    if (plants.length === 0) return;

    const visiblePlants = activeFilter === "due"
      ? orderedPlants.filter(function (plant) { return daysUntilWatering(plant) <= 0; })
      : orderedPlants;

    if (visiblePlants.length === 0) {
      const allClear = document.createElement("p");
      allClear.className = "queue-empty";
      allClear.textContent = "Nothing needs water right now. Your plants are on track.";
      plantList.append(allClear);
      return;
    }

    visiblePlants.forEach(function (plant, index) {
      plantList.append(makePlantRow(plant, index));
    });
  }

  function showView() {
    const requested = (window.location.hash || "#garden").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const exists = Array.prototype.some.call(views, function (view) { return view.id === requested; });
    const current = exists ? requested : "garden";

    views.forEach(function (view) { view.hidden = view.id !== current; });
    document.querySelectorAll("nav a").forEach(function (link) {
      if (link.getAttribute("href") === "#" + current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  function openPlantForm() {
    plantForm.reset();
    document.getElementById("plant-last-watered").value = toDateInputValue(new Date());
    plantDialog.showModal();
    document.getElementById("plant-name").focus();
  }

  document.getElementById("open-plant-form").addEventListener("click", openPlantForm);
  document.getElementById("empty-add-plant").addEventListener("click", openPlantForm);
  document.getElementById("close-plant-form").addEventListener("click", function () { plantDialog.close(); });
  document.getElementById("cancel-plant-form").addEventListener("click", function () { plantDialog.close(); });

  plantForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(plantForm);
    const newPlant = {
      id: "plant-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: String(formData.get("name")).trim(),
      species: String(formData.get("species")).trim(),
      intervalDays: Number(formData.get("intervalDays")),
      lastWatered: String(formData.get("lastWatered")),
      location: String(formData.get("location")).trim()
    };
    if (!newPlant.name || !newPlant.lastWatered || newPlant.intervalDays < 1 || newPlant.intervalDays > 90) return;

    plants.push(newPlant);
    savePlants();
    activeFilter = "all";
    document.querySelectorAll(".filter-button").forEach(function (button) {
      const selected = button.dataset.filter === activeFilter;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    plantDialog.close();
    renderPlants();
    showToast(newPlant.name + " added to your garden.");
  });

  document.querySelectorAll(".filter-button").forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-button").forEach(function (filterButton) {
        const selected = filterButton === button;
        filterButton.classList.toggle("is-active", selected);
        filterButton.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      renderPlants();
    });
  });

  window.addEventListener("hashchange", showView);
  savePlants();
  renderPlants();
  showView();
})();