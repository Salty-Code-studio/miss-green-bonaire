// Group price brackets, straight from missgreenbonaire.com/private-tours (USD per boat).
const BRACKETS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const PRICES = {
  mini:  [800, 1150, 1400, 1725, 2050, 2350, 2650, 2925, 3175],
  ocean: [900, 1275, 1650, 2000, 2350, 2675, 3000, 3300, 3575],
  full:  [1000, 1400, 1800, 2175, 2550, 2900, 3150, 3475, 3775],
};
const WA = "5997016692";
const usd = n => "$" + n.toLocaleString("en-US");

const range = document.getElementById("guests");
const out = document.getElementById("guestsOut");
const note = document.getElementById("bracketNote");

function update() {
  const g = Math.min(50, Math.max(1, +range.value));
  range.value = g;
  out.value = g;
  const i = BRACKETS.findIndex(max => g <= max);
  const lo = i === 0 ? 1 : BRACKETS[i - 1] + 1;
  note.textContent = `Groups of ${lo} to ${BRACKETS[i]} pay the same price.`;
  document.querySelectorAll(".tour").forEach(t => {
    const p = PRICES[t.dataset.tour][i];
    t.querySelector("[data-price]").textContent = usd(p);
    t.querySelector("[data-each]").textContent = g === 1 ? "for the whole boat" : `about ${usd(Math.round(p / g))} each`;
  });
}
range.addEventListener("input", update);
document.querySelectorAll(".step").forEach(b =>
  b.addEventListener("click", () => { range.value = +range.value + +b.dataset.step; update(); })
);
update();

// Booking buttons open WhatsApp with the group size and tour filled in.
document.querySelectorAll("[data-book]").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const tour = a.dataset.book;
    const msg = tour === "Cruise ship tour"
      ? "Hi Miss Green! I'm arriving on a cruise ship and would like the cruise tour. Ship: ... Date: ... Guests: ..."
      : `Hi Miss Green! We're a group of ${range.value} and would like the ${tour}. Preferred date: ...`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });
});

// Nav turns solid once the hero is behind us; floating WhatsApp appears.
const nav = document.querySelector(".nav");
const fab = document.querySelector(".wa-float");
const hero = document.querySelector(".hero");
new IntersectionObserver(([e]) => {
  nav.classList.toggle("solid", !e.isIntersecting);
  fab.classList.toggle("show", !e.isIntersecting);
}, { rootMargin: "-68px 0px 0px 0px" }).observe(hero);

// Scroll reveal.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const els = document.querySelectorAll("main section:not(.hero) > *, .foot-inner > *");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
}
