// Group price brackets, straight from missgreenbonaire.com/private-tours (USD per boat).
const BRACKETS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const PRICES = {
  mini:  [800, 1150, 1400, 1725, 2050, 2350, 2650, 2925, 3175],
  ocean: [900, 1275, 1650, 2000, 2350, 2675, 3000, 3300, 3575],
  full:  [1000, 1400, 1800, 2175, 2550, 2900, 3150, 3475, 3775],
};
const TOURS = {
  mini:   { name: "Mini Escape", hours: "3 hours", img: "../img/ss-2-13.jpg" },
  ocean:  { name: "Ocean Adventure", hours: "4 hours", img: "../img/ss-2-1.jpg" },
  full:   { name: "Full Experience", hours: "5 hours", img: "../img/ss-2-12.jpg" },
  cruise: { name: "Cruise Ship Tour", hours: "4 hours", img: "../img/ss-2-3.jpg" },
};
// PLACEHOLDER start times: not on their site yet, confirm with Miss Green.
const TIMES = {
  mini:  ["9:00 AM", "1:00 PM"],
  ocean: ["9:00 AM", "1:30 PM"],
  full:  ["9:30 AM"],
};
const WA = "5997016692";
const MAX = 50;
const usd = n => "$" + n.toLocaleString("en-US");
const $ = id => document.getElementById(id);

const today = new Date(); today.setHours(0, 0, 0, 0);
const first = new Date(today); first.setDate(today.getDate() + 1);
const state = { step: 1, guests: 4, date: null, time: null, month: new Date(first.getFullYear(), first.getMonth(), 1) };

const tour = () => document.querySelector("input[name=tour]:checked").value;
const isCruise = () => tour() === "cruise";
const bracket = () => BRACKETS.findIndex(max => state.guests <= max);
const price = () => isCruise() ? null : PRICES[tour()][bracket()];
const shortDate = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fullDate = d => d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const people = g => `${g} ${g === 1 ? "person" : "people"}`;

// Steps
const wiz = $("wiz");
function go(n, focus = true) {
  state.step = n;
  document.querySelectorAll(".wiz-step").forEach(s => s.hidden = +s.dataset.step !== n);
  $("wizBack").hidden = n === 1 || n === 4;
  $("wizCount").textContent = n === 4 ? "Done" : `${n} of 3`;
  wiz.dataset.at = n;
  render();
  if (!focus) return;
  if (wiz.getBoundingClientRect().top < 0) wiz.scrollIntoView({ block: "start" });
  const h = document.querySelector(`.wiz-step[data-step="${n}"] h3`);
  h.tabIndex = -1; h.focus({ preventScroll: true });
}
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
$("wizBack").addEventListener("click", () => go(state.step - 1));

// Step 1
document.querySelectorAll("input[name=tour]").forEach(r => r.addEventListener("change", () => { state.time = null; render(); }));
document.querySelectorAll("[data-cruise]").forEach(a => a.addEventListener("click", () => {
  document.querySelector("input[value=cruise]").checked = true;
  state.time = null; go(1);
}));

// Step 2
document.querySelectorAll(".people .step").forEach(b => b.addEventListener("click", () => {
  state.guests = Math.min(MAX, Math.max(1, state.guests + +b.dataset.step));
  render();
}));
$("calPrev").addEventListener("click", () => { state.month.setMonth(state.month.getMonth() - 1); drawCal(); });
$("calNext").addEventListener("click", () => { state.month.setMonth(state.month.getMonth() + 1); drawCal(); });
$("ship").addEventListener("input", render);

function drawCal() {
  const m = state.month, grid = $("calGrid");
  $("calTitle").textContent = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  $("calPrev").disabled = m <= new Date(first.getFullYear(), first.getMonth(), 1);
  $("calNext").disabled = (m.getFullYear() - today.getFullYear()) * 12 + m.getMonth() - today.getMonth() >= 12;
  grid.replaceChildren();
  for (let i = 0; i < m.getDay(); i++) grid.append(document.createElement("span"));
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  for (let n = 1; n <= days; n++) {
    const d = new Date(m.getFullYear(), m.getMonth(), n);
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = n;
    b.setAttribute("aria-label", d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" }));
    b.disabled = d < first;
    b.setAttribute("aria-pressed", String(+d === +state.date));
    b.addEventListener("click", () => { state.date = d; drawCal(); render(); });
    grid.append(b);
  }
}

function drawTimes() {
  const box = $("times"), list = TIMES[tour()] || [];
  if (list.length === 1) state.time = list[0];
  box.replaceChildren(...list.map(t => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t;
    b.setAttribute("aria-pressed", String(t === state.time));
    b.addEventListener("click", () => { state.time = t; render(); });
    return b;
  }));
}

function render() {
  const g = state.guests, i = bracket(), t = TOURS[tour()], cruise = isCruise(), p = price();

  // Step 1
  document.querySelectorAll(".opt input").forEach(r => {
    const el = r.closest(".opt").querySelector("[data-price]");
    if (el) el.textContent = usd(PRICES[r.value][i]);
  });
  $("tripNote").textContent = cruise
    ? "We send the cruise price for your ship's date."
    : `One price for ${g <= 10 ? "up to 10" : `${BRACKETS[i - 1] + 1} to ${BRACKETS[i]}`} people`;

  // Step 2
  $("timeBlock").hidden = cruise;
  $("shipBlock").hidden = !cruise;
  if (!cruise) drawTimes();
  $("guestsOut").value = g;
  document.querySelector(".people [data-step='-1']").disabled = g <= 1;
  document.querySelector(".people [data-step='1']").disabled = g >= MAX;
  $("peopleNote").textContent = g >= MAX ? "Bigger group? WhatsApp us" : `Up to ${BRACKETS[i]}`;
  const when = [state.date && shortDate(state.date), !cruise && state.time].filter(Boolean).join(" · ");
  $("sum2").textContent = [t.name, when || "Pick a day"].join(" · ");
  $("price2").textContent = p ? usd(p) : "";
  $("next2").disabled = !state.date || (!cruise && !state.time);

  // Step 3
  $("sumImg").src = t.img;
  $("sumName").textContent = t.name;
  $("sumHours").textContent = t.hours;
  $("sumWhen").textContent = state.date ? [fullDate(state.date), cruise ? $("ship").value.trim() : state.time].filter(Boolean).join(" · ") : "";
  $("sumPeople").textContent = people(g);
  $("sumTotal").textContent = p ? usd(p) : "On request";
  $("sumNote").textContent = cruise ? "We confirm it for your ship's date" : `One price for up to ${BRACKETS[i]} people`;
}

// Step 3: submit. This concept has no backend yet, so it shows the thank-you screen
// and offers the same request on WhatsApp.
$("wizForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("fName"), email = $("fEmail"), err = $("formError");
  const bad = !name.value.trim() ? [name, "Please write your name."]
    : !email.checkValidity() || !email.value.trim() ? [email, "Please write your email address."] : null;
  err.hidden = !bad;
  if (bad) { err.textContent = bad[1]; bad[0].focus(); return; }

  const t = TOURS[tour()], p = price();
  const lines = [
    "Hi Miss Green! I'd like to book:",
    `Trip: ${t.name} (${t.hours})`,
    `Day: ${fullDate(state.date)}${isCruise() ? "" : ` at ${state.time}`}`,
    isCruise() && `Ship: ${$("ship").value.trim() || "..."}`,
    `People: ${state.guests}`,
    p && `Price on your site: ${usd(p)} for the boat`,
    `Name: ${name.value.trim()}`,
    `Email: ${email.value.trim()}`,
  ].filter(Boolean);
  $("doneName").textContent = name.value.trim().split(" ")[0];
  $("doneTrip").textContent = `${t.name} on ${fullDate(state.date)}`;
  $("doneEmail").textContent = email.value.trim();
  $("doneWa").href = `https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`;
  go(4);
});
["fName", "fEmail"].forEach(id => $(id).addEventListener("input", () => $("formError").hidden = true));
$("restart").addEventListener("click", () => {
  $("wizForm").reset();
  Object.assign(state, { guests: 4, date: null, time: null });
  drawCal(); go(1);
});

drawCal();
go(1, false);

// Nav turns solid once the hero is behind us; floating Book button appears.
const nav = document.querySelector(".nav");
const fab = document.querySelector(".wa-float");
const hero = document.querySelector(".hero");
let pastHero = false, inBook = false;
const syncFab = () => fab.classList.toggle("show", pastHero && !inBook);
new IntersectionObserver(([e]) => {
  pastHero = !e.isIntersecting;
  nav.classList.toggle("solid", pastHero);
  syncFab();
}, { rootMargin: "-68px 0px 0px 0px" }).observe(hero);
new IntersectionObserver(([e]) => { inBook = e.isIntersecting; syncFab(); }).observe($("book"));

// Scroll reveal.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const els = document.querySelectorAll("main section:not(.hero):not(.book) > *, .foot-inner > *");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
}
