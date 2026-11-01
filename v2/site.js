// Group price brackets, straight from missgreenbonaire.com/private-tours (USD per boat).
const BRACKETS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const PRICES = {
  mini:  [800, 1150, 1400, 1725, 2050, 2350, 2650, 2925, 3175],
  ocean: [900, 1275, 1650, 2000, 2350, 2675, 3000, 3300, 3575],
  full:  [1000, 1400, 1800, 2175, 2550, 2900, 3150, 3475, 3775],
};
// Simple names on screen, their official names in the WhatsApp message.
const TOURS = {
  mini:  { name: "Short trip", official: "Mini Escape (3 hours)" },
  ocean: { name: "Ocean trip", official: "Ocean Adventure (4 hours)" },
  full:  { name: "Long trip", official: "Full Experience (5 hours)" },
};
const WA = "5997016692";
const MAX = 50;
const usd = n => "$" + n.toLocaleString("en-US");
const $ = id => document.getElementById(id);

const today = new Date(); today.setHours(0, 0, 0, 0);
const first = new Date(today); first.setDate(today.getDate() + 1);
const state = { guests: 6, cruise: false, date: null, month: new Date(first.getFullYear(), first.getMonth(), 1) };

const tour = () => document.querySelector("input[name=tour]:checked").value;
const bracket = () => BRACKETS.findIndex(max => state.guests <= max);
const longDate = d => d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

// Step 1: people
document.querySelectorAll(".count .step").forEach(b => b.addEventListener("click", () => {
  state.guests = Math.min(MAX, Math.max(1, state.guests + +b.dataset.step));
  render();
}));
$("cruiseToggle").addEventListener("change", e => { state.cruise = e.target.checked; render(); });
document.querySelectorAll("[data-cruise]").forEach(a => a.addEventListener("click", () => {
  $("cruiseToggle").checked = state.cruise = true; render();
}));

// Step 2: trip
document.querySelectorAll("input[name=tour]").forEach(r => r.addEventListener("change", render));

// Step 3: day
$("calPrev").addEventListener("click", () => { state.month.setMonth(state.month.getMonth() - 1); drawCal(); });
$("calNext").addEventListener("click", () => { state.month.setMonth(state.month.getMonth() + 1); drawCal(); });

function drawCal() {
  const m = state.month, grid = $("calGrid");
  $("calTitle").textContent = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  $("calPrev").disabled = m <= new Date(first.getFullYear(), first.getMonth(), 1);
  $("calNext").disabled = (m.getFullYear() - today.getFullYear()) * 12 + m.getMonth() - today.getMonth() >= 12;
  grid.replaceChildren();
  for (let i = 0; i < (m.getDay() + 6) % 7; i++) grid.append(document.createElement("span"));
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  for (let n = 1; n <= days; n++) {
    const d = new Date(m.getFullYear(), m.getMonth(), n);
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = n;
    b.setAttribute("aria-label", longDate(d));
    b.disabled = d < first;
    b.setAttribute("aria-pressed", String(+d === +state.date));
    b.addEventListener("click", () => { state.date = d; drawCal(); render(); });
    grid.append(b);
  }
}

function render() {
  const g = state.guests, i = bracket();
  $("guestsOut").value = g;
  document.querySelector("[data-step='-1']").disabled = g <= 1;
  document.querySelector("[data-step='1']").disabled = g >= MAX;
  $("guestsHint").textContent = g >= MAX ? "That's the most we can take. Bigger group? Ask us on WhatsApp." : "Count everyone, kids too.";

  document.querySelectorAll(".trip input").forEach(r => {
    const p = PRICES[r.value][i], card = r.closest(".trip");
    card.querySelector("[data-price]").textContent = usd(p);
    card.querySelector("[data-each]").textContent = g === 1 ? "for the boat" : `${usd(Math.round(p / g))} each`;
  });
  $("trips").hidden = state.cruise;
  $("cruiseTrip").hidden = !state.cruise;
  $("priceHint").textContent = state.cruise
    ? "We send you the cruise price on WhatsApp."
    : `You pay for the whole boat. Up to ${BRACKETS[i]} people pay the same.`;

  const t = TOURS[tour()];
  const what = state.cruise ? "Cruise ship trip" : `${t.name}, ${usd(PRICES[tour()][i])}`;
  $("summary").innerHTML = `<b>${g} ${g === 1 ? "person" : "people"}</b> · <b>${what}</b> · <b>${state.date ? longDate(state.date) : "no day yet"}</b>`;
  const btn = $("bookBtn");
  btn.disabled = !state.date;
  btn.textContent = state.date ? "Book this trip" : "Pick a day first";
}

// Booking opens WhatsApp with everything filled in.
$("bookBtn").addEventListener("click", () => {
  const g = state.guests, i = bracket();
  const lines = state.cruise
    ? ["Hi Miss Green! I'd like to book:", "Trip: Cruise ship tour", `Day: ${longDate(state.date)}`, `People: ${g}`, "Our ship: "]
    : ["Hi Miss Green! I'd like to book:", `Trip: ${TOURS[tour()].official}`, `Day: ${longDate(state.date)}`, `People: ${g}`, `Price on your site: ${usd(PRICES[tour()][i])} for the boat`, "Is this day free?"];
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
});

drawCal();
render();

// Nav turns solid once the hero is behind us; floating Book button appears.
const nav = document.querySelector(".nav");
const fab = document.querySelector(".wa-float");
const hero = document.querySelector(".hero");
const book = $("book");
let pastHero = false, inBook = false;
const syncFab = () => fab.classList.toggle("show", pastHero && !inBook);
new IntersectionObserver(([e]) => {
  pastHero = !e.isIntersecting;
  nav.classList.toggle("solid", pastHero);
  syncFab();
}, { rootMargin: "-68px 0px 0px 0px" }).observe(hero);
new IntersectionObserver(([e]) => { inBook = e.isIntersecting; syncFab(); }).observe(book);

// Scroll reveal.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const els = document.querySelectorAll("main section:not(.hero):not(.book) > *, .foot-inner > *");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
}
