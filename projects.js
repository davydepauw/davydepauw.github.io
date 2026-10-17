const linkList = document.querySelector("#link-list");
const projectList = document.querySelector("#project-list");
const status = document.querySelector("#project-status");

function readList(id) {
  const node = document.querySelector(id);
  const data = JSON.parse(node.textContent);
  if (!Array.isArray(data)) throw new Error(`${id} is not an array`);
  return data;
}

function linkItem(link) {
  const item = document.createElement("li");
  const anchor = document.createElement("a");
  anchor.href = link.url;
  anchor.textContent = link.label;
  item.append(anchor);
  return item;
}

function projectItem(project, index) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.className = "project";
  link.href = project.url;

  const number = document.createElement("span");
  number.className = "number";
  number.setAttribute("aria-hidden", "true");
  number.textContent = String(index + 1).padStart(2, "0");

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = project.name;

  const kind = document.createElement("span");
  kind.className = "kind";
  kind.textContent = project.kind;

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  const description = document.createElement("span");
  description.className = "description";
  description.textContent = project.description;

  const suffix = document.createElement("span");
  suffix.className = "visually-hidden";
  suffix.textContent = " on GitHub";

  link.append(number, name, kind, arrow, description, suffix);
  item.append(link);
  return item;
}

function showError(list, message) {
  list.replaceChildren();
  const item = document.createElement("li");
  item.className = "projects-error";
  item.textContent = message;
  list.append(item);
  list.setAttribute("aria-busy", "false");
}

try {
  const links = readList("#links-data");
  linkList.replaceChildren(...links.map(linkItem));
  linkList.setAttribute("aria-busy", "false");
} catch {
  showError(linkList, "The link list could not be loaded.");
}

try {
  const projects = readList("#projects-data");
  projectList.replaceChildren(
    ...projects.map((project, index) => projectItem(project, index)),
  );
  const count = projects.length;
  const label = count === 1 ? "repo" : "repos";
  status.textContent = `${count} public ${label} · Ghent, Belgium`;
  projectList.setAttribute("aria-busy", "false");
} catch {
  showError(projectList, "The project list could not be loaded.");
}

const terminal = document.querySelector("#terminal");
const closeTerminal = document.querySelector("#close-terminal");
const maximizeTerminal = document.querySelector("#maximize-terminal");
const openTerminal = document.querySelector("#open-terminal");
const skipLink = document.querySelector(".skip");
const maximizeGlyph = maximizeTerminal.querySelector(".dot-glyph");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const bootCommands = [...terminal.querySelectorAll("[data-boot] .command")];
let bootGeneration = 0;

for (const command of bootCommands) {
  command.dataset.text = command.textContent;
}

function wait(ms, generation) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(generation === bootGeneration), ms);
  });
}

function restoreCommands() {
  for (const command of bootCommands) {
    command.textContent = command.dataset.text;
  }
}

function showBootFinal() {
  restoreCommands();
  terminal.classList.remove("is-running", "is-booting");
  terminal.style.minHeight = "";
  terminal.querySelectorAll(".is-shown, .is-typing").forEach((node) => {
    node.classList.remove("is-shown", "is-typing");
  });
}

async function bootTerminal() {
  const generation = ++bootGeneration;
  if (reducedMotion.matches) {
    showBootFinal();
    return;
  }

  const alive = () => generation === bootGeneration;
  restoreCommands();
  terminal.style.minHeight = `${terminal.getBoundingClientRect().height}px`;
  terminal.querySelectorAll(".is-shown, .is-typing").forEach((node) => {
    node.classList.remove("is-shown", "is-typing");
  });
  for (const command of bootCommands) command.textContent = "";
  terminal.classList.add("is-booting", "is-running");

  const reveal = async (node, ms) => {
    if (!alive()) return false;
    node.classList.add("is-shown");
    return wait(ms, generation);
  };

  const typeLine = async (name) => {
    const line = terminal.querySelector(`[data-boot="${name}"]`);
    const command = line.querySelector(".command");
    command.textContent = "";
    line.classList.add("is-shown", "is-typing");
    for (const char of command.dataset.text) {
      if (!await wait(28, generation)) return false;
      command.textContent += char;
    }
    line.classList.remove("is-typing");
    return alive();
  };

  const stagger = async (list) => {
    if (!alive()) return false;
    list.classList.add("is-shown");
    const items = [...list.children].filter((node) => node.tagName === "LI");
    for (const [index, item] of items.entries()) {
      if (index > 0 && !await wait(48, generation)) return false;
      item.classList.add("is-shown");
    }
    return alive();
  };

  try {
    if (!await wait(90, generation)) return;
    if (!await reveal(terminal.querySelector("h1"), 200)) return;
    if (!await typeLine("whoami")) return;
    if (!await reveal(terminal.querySelector(".intro"), 70)) return;
    if (!await stagger(linkList)) return;
    if (!await wait(110, generation)) return;
    if (!await typeLine("ls")) return;
    if (!await stagger(projectList)) return;
    if (!await reveal(terminal.querySelector(".idle"), 60)) return;
    if (!await reveal(status, 40)) return;
  } finally {
    if (alive()) showBootFinal();
  }
}

function finishClose() {
  if (terminal.classList.contains("is-closed")) return;
  terminal.classList.remove("is-closing");
  terminal.classList.add("is-closed");
  terminal.inert = true;
  openTerminal.hidden = false;
  skipLink.href = "#open-terminal";
  openTerminal.focus();
}

closeTerminal.addEventListener("click", () => {
  bootGeneration += 1;
  if (terminal.classList.contains("is-closing") || terminal.classList.contains("is-closed")) return;

  openTerminal.hidden = false;

  if (reducedMotion.matches) {
    finishClose();
    return;
  }

  terminal.classList.add("is-closing");
  const fallback = setTimeout(finishClose, 280);
  terminal.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "opacity") return;
    clearTimeout(fallback);
    finishClose();
  }, { once: true });
});

openTerminal.addEventListener("click", () => {
  openTerminal.hidden = true;
  terminal.inert = false;
  terminal.classList.remove("is-closing", "is-closed");
  skipLink.href = "#projects";
  closeTerminal.focus();
  bootTerminal();
});

bootTerminal();

maximizeTerminal.addEventListener("click", () => {
  const maximized = maximizeTerminal.getAttribute("aria-pressed") !== "true";
  maximizeTerminal.setAttribute("aria-pressed", String(maximized));
  maximizeGlyph.textContent = maximized ? "–" : "+";
});
