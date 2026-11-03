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
  custom: { name: "Custom trip", hours: "", img: "../img/ss-homep1-1.jpg" },
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
const state = { step: 1, guests: 4, date: null, time: null, custom: false, hours: 5, month: new Date(first.getFullYear(), first.getMonth(), 1) };

const tour = () => state.custom ? "custom" : document.querySelector("input[name=tour]:checked").value;
const isCruise = () => tour() === "cruise";
const bracket = () => BRACKETS.findIndex(max => state.guests <= max);
const price = () => PRICES[tour()]?.[bracket()] ?? null;
const shortDate = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fullDate = d => d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const picked = name => [...document.querySelectorAll(`input[name=${name}]:checked`)].map(i => i.value);
const hoursText = () => state.custom ? `${state.hours} hours` : TOURS[tour()].hours;
const people = g => `${g} ${g === 1 ? "person" : "people"}`;

// Booking card: only on the home page.
const wiz = $("wiz");
if (wiz) {
// Steps
function go(n, focus = true) {
  state.step = n;
  document.querySelectorAll(".wiz-step").forEach(s => s.hidden = +s.dataset.step !== n);
  $("wizBack").hidden = n === 1 || n === 4;
  $("wizCount").textContent = n === 4 ? "Done" : `${n} of 3`;
  wiz.dataset.at = $("book").dataset.at = n;
  render();
  if (!focus) return;
  if (wiz.getBoundingClientRect().top < 0) wiz.scrollIntoView({ block: "start" });
  const h = document.querySelector(`.wiz-step[data-step="${n}"] h3`);
  h.tabIndex = -1; h.focus({ preventScroll: true });
}
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
$("wizBack").addEventListener("click", () => go(state.step - 1));
// The step tracker above the card jumps to any step that's ready.
const ready = n => n < 3 || (state.date && (isCruise() || state.custom || state.time));
document.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => go(+b.dataset.jump)));

// Step 1
document.querySelectorAll("input[name=tour]").forEach(r => r.addEventListener("change", () => { state.custom = false; state.time = null; render(); }));
$("customBtn").addEventListener("click", () => { state.custom = true; state.time = null; go(2); });
document.querySelectorAll("[data-cruise]").forEach(a => a.addEventListener("click", () => {
  document.querySelector("input[value=cruise]").checked = true;
  state.custom = false; state.time = null; go(1);
}));

// Step 2
document.querySelectorAll(".people .step").forEach(b => b.addEventListener("click", () => {
  state.guests = Math.min(MAX, Math.max(1, state.guests + +b.dataset.step));
  render();
}));
$("calPrev").addEventListener("click", () => { state.month.setMonth(state.month.getMonth() - 1); drawCal(); });
$("calNext").addEventListener("click", () => { state.month.setMonth(state.month.getMonth() + 1); drawCal(); });
$("ship").addEventListener("input", render);

// Custom trip builder
$("cGuests").addEventListener("input", e => { state.guests = +e.target.value; render(); });
$("cHours").addEventListener("input", e => { state.hours = +e.target.value; render(); });
document.querySelectorAll("input[name=food], input[name=extra]").forEach(c => c.addEventListener("change", render));

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
  const g = state.guests, i = bracket(), t = TOURS[tour()], cruise = isCruise(), custom = state.custom, p = price();

  // Step 1
  document.querySelectorAll(".opt input").forEach(r => {
    const el = r.closest(".opt").querySelector("[data-price]");
    if (el) el.textContent = usd(PRICES[r.value][i]);
  });
  $("tripNote").textContent = cruise
    ? "We send the cruise price for your ship's date."
    : g <= 10 ? "One price for up to 10 people" : `Prices shown for ${g} people. You can change this in the next step.`;

  // Step 2
  wiz.classList.toggle("is-custom", custom);
  $("step2Title").textContent = custom ? "Plan your custom trip" : "Choose a date & time";
  $("jump2").textContent = custom ? "Plan your day" : "Pick a day and time";
  $("timeBlock").hidden = cruise || custom;
  $("shipBlock").hidden = !cruise;
  if (!cruise && !custom) drawTimes();
  $("cGuests").value = g;
  $("cGuestsOut").value = people(g);
  $("cHours").value = state.hours;
  $("cHoursOut").value = `${state.hours} hours`;
  ["cGuests", "cHours"].forEach(id => { const el = $(id); el.style.setProperty("--fill", `${(el.value - el.min) / (el.max - el.min) * 100}%`); });
  $("guestsOut").value = g;
  document.querySelector(".people [data-step='-1']").disabled = g <= 1;
  document.querySelector(".people [data-step='1']").disabled = g >= MAX;
  $("peopleNote").textContent = g >= MAX ? "Bigger group? WhatsApp us" : `Up to ${BRACKETS[i]}`;
  const when = [state.date && shortDate(state.date), !cruise && state.time].filter(Boolean).join(" · ");
  $("sum2").textContent = custom
    ? [t.name, state.date ? shortDate(state.date) : "Pick a day", `${state.hours} hours`, people(g)].join(" · ")
    : [t.name, when || "Pick a day"].join(" · ");
  $("price2").textContent = custom ? "Quote" : p ? usd(p) : "";
  $("next2").disabled = !ready(3);
  document.querySelectorAll("[data-jump]").forEach(b => {
    const n = +b.dataset.jump, here = n === state.step;
    b.disabled = state.step === 4 || (!here && !ready(n));
    here ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current");
  });

  // Step 3
  $("sumImg").src = t.img;
  $("sumName").textContent = t.name;
  $("sumHours").textContent = hoursText();
  $("sumWhen").textContent = state.date ? [fullDate(state.date), cruise ? $("ship").value.trim() : state.time].filter(Boolean).join(" · ") : "";
  $("sumPeople").textContent = people(g);
  const extras = custom ? [...picked("food"), ...picked("extra")] : [];
  $("sumExtrasRow").hidden = !extras.length;
  $("sumExtras").textContent = extras.join(", ");
  $("sumTotal").textContent = custom ? "Custom quote" : p ? usd(p) : "On request";
  $("sumNote").textContent = custom ? "We email you a price for your day"
    : cruise ? "We confirm it for your ship's date" : `One price for up to ${BRACKETS[i]} people`;
  $("submitBtn").firstChild.textContent = custom ? "Get my custom quote " : "Book this trip ";
  $("submitFoot").textContent = custom ? "No payment now. We'll email you a price." : "We'll email your trip details.";
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
  const food = picked("food"), extra = picked("extra"), notes = $("cNotes").value.trim();
  const lines = [
    state.custom ? "Hi Miss Green! I'd like a quote for a custom trip:" : "Hi Miss Green! I'd like to book:",
    `Trip: ${t.name} (${hoursText()})`,
    `Day: ${fullDate(state.date)}${isCruise() || state.custom ? "" : ` at ${state.time}`}`,
    isCruise() && `Ship: ${$("ship").value.trim() || "..."}`,
    `People: ${state.guests}`,
    p && `Price on your site: ${usd(p)} for the boat`,
    state.custom && food.length && `Food: ${food.join(", ")}`,
    state.custom && extra.length && `Extras: ${extra.join(", ")}`,
    state.custom && notes && `Notes: ${notes}`,
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
  Object.assign(state, { guests: 4, date: null, time: null, custom: false, hours: 5 });
  drawCal(); go(1);
});

drawCal();
go(1, false);
// Links from other pages can preselect the cruise trip: ?tour=cruise#book
if (new URLSearchParams(location.search).get("tour") === "cruise") { document.querySelector("input[value=cruise]").checked = true; render(); }
}

// Nav turns solid once the hero is behind us; floating Book button appears.
const nav = document.querySelector(".nav");
const fab = document.querySelector(".wa-float");
const hero = document.querySelector(".hero");
let pastHero = false, inBook = false, inFoot = false;
const syncFab = () => fab.classList.toggle("show", pastHero && !inBook && !inFoot);
new IntersectionObserver(([e]) => {
  pastHero = !e.isIntersecting;
  nav.classList.toggle("solid", pastHero);
  syncFab();
}, { rootMargin: "-68px 0px 0px 0px" }).observe(hero);
{ const sf = document.querySelector(".site-foot"); if (sf) new IntersectionObserver(([e]) => { inFoot = e.isIntersecting; syncFab(); }).observe(sf); }
if ($("book")) new IntersectionObserver(([e]) => { inBook = e.isIntersecting; syncFab(); }).observe($("book"));

// Over dark sections the frosted bar turns to dark glass.
{
  const dark = document.querySelectorAll("section.eco, .site-foot");
  const on = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? on.add(e.target) : on.delete(e.target));
    nav.classList.toggle("on-dark", on.size > 0);
  }, { rootMargin: `-40px 0px -${Math.max(innerHeight - 44, 0)}px 0px` });
  dark.forEach(d => io.observe(d));
}

// Hero bottom: a straight edge at rest that swells into a rolling wave as you scroll.
{
  const path = document.querySelector(".hero .wave-front path"), press = document.querySelector(".hero .press");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw = () => {
    const y = scrollY, p = still ? 0 : Math.min(y / 320, 1), phase = y * 0.006;
    let d = "M0 100";
    for (let i = 0; i <= 48; i++) {
      const x = i * 30, h = p * 36 * (1 + Math.sin(x / 1440 * Math.PI * 2.6 + phase));
      d += ` L${x} ${(100 - h).toFixed(1)}`;
    }
    path.setAttribute("d", d + " V100 H0 Z");
    if (press) press.style.setProperty("--wave", p.toFixed(3));
  };
  if (path) {
    let ticking = false;
    draw();
    addEventListener("scroll", () => {
      if (ticking || scrollY > hero.offsetHeight) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; draw(); });
    }, { passive: true });
  }
}

// Home page: highlight the menu link for the section on screen.
if (!hero.classList.contains("hero-page")) {
  const links = [...nav.querySelectorAll("nav a[data-sec]")];
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.setAttribute("aria-current", String(a.dataset.sec === e.target.id)));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(a => { const t = $(a.dataset.sec); if (t) io.observe(t); });
  new IntersectionObserver(([e]) => { if (e.isIntersecting) links.forEach(a => a.setAttribute("aria-current", "false")); }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
}

// Scroll reveal.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const els = document.querySelectorAll("main section:not(.hero):not(.book):not(.included):not(.eco):not(.reviews) > *, .foot-inner > *");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
}

// Packing checklist: "we bring" ticks itself off on view; visitors tick off "you only bring".
if ($("included")) {
  const inc = $("included"), boxes = [...inc.querySelectorAll('.cl-you input')], done = $("clDone");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    inc.classList.add("inc-motion");
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { inc.classList.add("inc-in"); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(inc);
  }
  boxes.forEach(b => b.addEventListener("change", () => {
    done.textContent = boxes.every(x => x.checked) ? "You're all set. See you on board!" : "";
  }));
}

// Boat callouts: a solid tag behind each label so it reads over sky and water.
document.querySelectorAll(".call text").forEach(t => {
  const b = t.getBBox(), r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("class", "tag");
  r.setAttribute("x", b.x - 10); r.setAttribute("y", b.y - 6);
  r.setAttribute("width", b.width + 20); r.setAttribute("height", b.height + 12); r.setAttribute("rx", 6);
  t.before(r);
});

// Eco spec sheet: panels rise, callout lines draw, comparison bars grow.
if ($("eco") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const eco = $("eco");
  eco.classList.add("eco-motion");
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { eco.classList.add("eco-in"); obs.disconnect(); }
  }, { threshold: 0.08 }).observe(eco);
}

// Reviews photo wall: tiles pop in one by one, columns drift at different speeds as you scroll.
if (document.querySelector(".rev-head") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const head = document.querySelector(".rev-head"), cols = [...head.querySelectorAll(".m-col")];
  head.querySelectorAll(".mosaic figure").forEach((f, i) => f.style.setProperty("--d", i % 9));
  head.classList.add("mosaic-motion");
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { head.classList.add("mosaic-in"); obs.disconnect(); }
  }, { threshold: 0.15 }).observe(head);

  let ticking = false;
  const drift = () => {
    ticking = false;
    const r = head.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight - r.top) / (innerHeight + r.height) - .5;
    cols.forEach(c => c.style.setProperty("--py", `${(-p * c.dataset.speed).toFixed(1)}px`));
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  drift();
}

// Reviews: the rail drifts on its own, pauses on hover/touch/focus, and can be scrolled or dragged by hand.
if ($("revRail")) {
  const rail = $("revRail"), track = $("revTrack");
  [...track.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); k.querySelectorAll("a").forEach(a => a.tabIndex = -1); track.append(k); });
  const half = () => track.scrollWidth / 2;
  const wrap = () => { if (rail.scrollLeft >= half()) rail.scrollLeft -= half(); else if (rail.scrollLeft <= 0) rail.scrollLeft += half(); };
  let paused = false, resumeAt = 0;
  const hold = (ms = 0) => { paused = true; resumeAt = ms ? performance.now() + ms : Infinity; };
  rail.addEventListener("pointerenter", () => hold());
  rail.addEventListener("pointerleave", () => hold(800));
  rail.addEventListener("focusin", () => hold());
  rail.addEventListener("focusout", () => hold(800));
  rail.addEventListener("touchstart", () => hold(), { passive: true });
  rail.addEventListener("touchend", () => hold(2500), { passive: true });
  rail.addEventListener("scroll", wrap, { passive: true });

  // Drag to scroll with a mouse.
  let dragX = null, startLeft = 0, moved = false;
  rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; dragX = e.clientX; startLeft = rail.scrollLeft; moved = false; });
  addEventListener("pointermove", e => { if (dragX === null) return; const dx = e.clientX - dragX; if (Math.abs(dx) > 4) { moved = true; rail.classList.add("dragging"); } rail.scrollLeft = startLeft - dx; });
  addEventListener("pointerup", () => { dragX = null; rail.classList.remove("dragging"); });
  rail.addEventListener("click", e => { if (moved) { e.preventDefault(); moved = false; } }, true);

  const step = dir => { hold(3000); rail.scrollBy({ left: dir * (track.firstElementChild.offsetWidth + 18), behavior: "smooth" }); };
  $("revPrev")?.addEventListener("click", () => step(-1));
  $("revNext")?.addEventListener("click", () => step(1));

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let last = performance.now(), acc = 0;
    const tick = now => {
      const dt = Math.min(now - last, 50); last = now;
      if (paused && now >= resumeAt) paused = false;
      if (!paused && dragX === null) {
        acc += dt * 0.035; // scrollLeft only takes whole pixels, so collect sub-pixel steps
        if (acc >= 1) { rail.scrollLeft += Math.floor(acc); acc -= Math.floor(acc); wrap(); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// Footer Instagram counter: digits flip up from zero when it scrolls into view.
(() => {
  const box = document.querySelector("[data-ig-count]");
  if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = box.dataset.igCount, cells = [...box.querySelectorAll(".fd b")];
  const show = n => String(n).padStart(target.length, "0").split("").forEach((d, i) => {
    if (cells[i].textContent === d) return;
    cells[i].textContent = d;
    const fd = cells[i].parentElement; fd.classList.remove("flip"); void fd.offsetWidth; fd.classList.add("flip");
  });
  show(0);
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    const end = +target, t0 = performance.now(), dur = 1400;
    const tick = t => { const k = Math.min((t - t0) / dur, 1); show(Math.round(end * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { threshold: .6 }).observe(box);
})();

