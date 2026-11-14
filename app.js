// DOM references: cache the page elements that the script reads or updates.
const list = document.getElementById("service-list");
const search = document.getElementById("search");
const category = document.getElementById("category");
const clock = document.getElementById("clock");
const totalCount = document.getElementById("total-count");

let services = [];

// Load service configuration from the separate JSON file.
async function loadServices() {
  try {
    const response = await fetch("./services.json");
    if (!response.ok) {
      throw new Error(`Could not load services.json (${response.status})`);
    }

    const data = await response.json();
    services = Array.isArray(data.services) ? data.services : [];

    populateCategories();
    totalCount.textContent = String(services.length).padStart(2, "0");
    renderServices();
  } catch (error) {
    console.error(error);
    list.textContent = "Could not load services. Check services.json and run this page through a local web server.";
  }
}

// Build the category dropdown from the categories actually present in the data.
function populateCategories() {
  const categoryNames = [...new Set(
    services.map(service => service.category).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  for (const name of categoryNames) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    category.append(option);
  }
}

// Return the visible services after applying both filters and alphabetical sorting.
function getFilteredServices() {
  const query = search.value.trim().toLowerCase();
  const selectedCategory = category.value;

  return services
    .filter(service => !selectedCategory || service.category === selectedCategory)
    .filter(service => {
      const searchableText = [
        service.name,
        service.description,
        service.url,
        service.category
      ].join(" ").toLowerCase();

      return searchableText.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Create one clickable card for a service.
function createServiceCard(service) {
  const link = document.createElement("a");
  link.className = "service-card";
  link.href = service.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const top = document.createElement("div");
  top.className = "card-top";

  const icon = document.createElement("span");
  icon.className = "card-icon";
  icon.textContent = service.icon || "↗";

  const tag = document.createElement("span");
  tag.className = "card-category";
  tag.textContent = service.category || "Other";
  top.append(icon, tag);

  const bottom = document.createElement("div");
  bottom.className = "card-bottom";

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = service.name || "Unnamed service";

  const description = document.createElement("div");
  description.className = "card-description";
  description.textContent = service.description || "";

  const foot = document.createElement("div");
  foot.className = "card-foot";

  const host = document.createElement("span");
  host.className = "card-host";
  host.textContent = getHostLabel(service.url);

  const open = document.createElement("span");
  open.className = "card-open";
  open.textContent = "OPEN ↗";

  foot.append(host, open);
  bottom.append(name, description, foot);
  link.append(top, bottom);

  return link;
}

// Draw the current result set into the service grid.
function renderServices() {
  const results = getFilteredServices();
  list.replaceChildren();

  if (results.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No services match your search.";
    list.append(empty);
    return;
  }

  for (const service of results) {
    list.append(createServiceCard(service));
  }
}

// Show a compact hostname in the card footer. The link itself still uses service.url.
function getHostLabel(url) {
  try {
    return new URL(url).host;
  } catch {
    return url || "";
  }
}

// Update the digital clock using the browser's local time.
function updateClock() {
  clock.textContent = new Date().toLocaleTimeString("en-GB");
}

// Wire up UI events, then initialize the page.
search.addEventListener("input", renderServices);
category.addEventListener("change", renderServices);

updateClock();
setInterval(updateClock, 1000);

loadServices();
