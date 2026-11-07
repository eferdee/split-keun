/* UI logic for Split Keun. Calculation lives in calc.js. */
(() => {
  /* ---------- Constants & state ---------- */
  const STORAGE_KEY = "split-keun-state";
  const THEME_KEY = "split-keun-theme";

  const PRESETS = {
    restaurant: { service: 5, tax: 10 },
    pb1: { service: 0, tax: 10 },
    none: { service: 0, tax: 0 },
  };

  const defaultState = () => ({
    mode: "even",
    people: [
      { id: 1, name: "Aku" },
      { id: 2, name: "Teman 1" },
    ],
    items: [],
    total: "",
    service: 0,
    tax: 0,
    tip: 0,
    roundTo: 1,
    nextId: 3,
  });

  let state = defaultState();
  let toastTimer;

  /* ---------- Helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);
  const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

  function el(tag, props = {}, ...children) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function showToast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2200);
  }

  const save = () => storageSet(STORAGE_KEY, JSON.stringify(state));

  /* ---------- Calculation + results ---------- */
  function compute() {
    return SplitCalc.calculate({
      mode: state.mode,
      people: state.people,
      items: state.items,
      total: state.total,
      servicePct: Number(state.service) || 0,
      taxPct: Number(state.tax) || 0,
      tip: Number(state.tip) || 0,
      roundTo: Number(state.roundTo) || 1,
    });
  }

  function renderResults() {
    const r = compute();
    $("grandTotal").textContent = rupiah(r.grand);

    // Breakdown
    const lines = [["Subtotal", r.subtotal]];
    if (r.service) lines.push(["Service", r.service]);
    if (r.tax) lines.push(["Pajak", r.tax]);
    if (r.tip) lines.push(["Tip", r.tip]);
    $("breakdown").replaceChildren(
      ...lines.flatMap(([label, value]) => [el("dt", { textContent: label }), el("dd", { textContent: rupiah(value) })])
    );

    // Warnings
    const warnings = [];
    if (!state.people.length) warnings.push("Tambahkan minimal satu peserta.");
    if (r.unassigned > 0) warnings.push(`${rupiah(r.unassigned)} belum dibagi ke siapa pun.`);
    const diff = r.collected - r.grand;
    if (state.people.length && diff > 0.5 && Number(state.roundTo) > 1) {
      warnings.push(`Pembulatan menambah ${rupiah(diff)} dari total.`);
    }
    $("warning").hidden = !warnings.length;
    $("warning").textContent = warnings.join(" ");

    // Per-person list
    $("resultList").replaceChildren(
      ...r.rows.map((row) =>
        el("li", {}, el("span", { className: "avatar", textContent: row.name.charAt(0).toUpperCase() || "?" }),
          el("span", { className: "name", textContent: row.name }),
          el("strong", { textContent: rupiah(row.amount) }))
      )
    );
    return r;
  }

  /* ---------- People ---------- */
  function renderPeople() {
    $("peopleList").replaceChildren(
      ...state.people.map((p) => {
        const remove = el("button", { type: "button", className: "chip-x", ariaLabel: `Hapus ${p.name}`, textContent: "×" });
        remove.addEventListener("click", () => removePerson(p.id));
        return el("span", { className: "chip" }, p.name, remove);
      })
    );
  }

  function addPerson(name) {
    state.people.push({ id: state.nextId++, name });
    renderAll();
  }

  function removePerson(id) {
    state.people = state.people.filter((p) => p.id !== id);
    state.items.forEach((item) => (item.who = item.who.filter((w) => w !== id)));
    renderAll();
  }

  /* ---------- Items ---------- */
  function renderItems() {
    const list = $("itemList");
    list.replaceChildren();

    state.items.forEach((item, index) => {
      const nameInput = el("input", { type: "text", placeholder: "Nama item", value: item.name, maxLength: 30 });
      nameInput.addEventListener("input", () => { item.name = nameInput.value; save(); });

      const priceInput = el("input", { type: "number", min: 0, inputMode: "numeric", placeholder: "Harga", value: item.price });
      priceInput.addEventListener("input", () => { item.price = priceInput.value; save(); renderResults(); });

      const remove = el("button", { type: "button", className: "chip-x", ariaLabel: "Hapus item", textContent: "×" });
      remove.addEventListener("click", () => { state.items.splice(index, 1); renderAll(); });

      const who = el("div", { className: "who" }, ...state.people.map((p) => {
        const btn = el("button", { type: "button", className: "chip-btn" + (item.who.includes(p.id) ? " on" : ""), textContent: p.name });
        btn.addEventListener("click", () => {
          item.who = item.who.includes(p.id) ? item.who.filter((w) => w !== p.id) : [...item.who, p.id];
          btn.classList.toggle("on");
          save();
          renderResults();
        });
        return btn;
      }));

      list.append(el("div", { className: "item" }, el("div", { className: "row" }, nameInput, priceInput, remove), who));
    });
  }

  /* ---------- Mode & inputs ---------- */
  function renderMode() {
    $$(".tab").forEach((tab) => {
      const active = tab.dataset.mode === state.mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    $("panelEven").hidden = state.mode !== "even";
    $("panelItems").hidden = state.mode !== "items";
  }

  function syncInputs() {
    $("totalInput").value = state.total;
    $("serviceInput").value = state.service;
    $("taxInput").value = state.tax;
    $("tipInput").value = state.tip;
    $("roundSelect").value = String(state.roundTo);
  }

  function renderAll() {
    renderMode();
    renderPeople();
    renderItems();
    renderResults();
    save();
  }

  /* ---------- Share ---------- */
  function buildSummary() {
    const r = compute();
    const lines = ["🧾 Patungan (Split Keun)", `Total: ${rupiah(r.grand)}`, ""];
    r.rows.forEach((row) => lines.push(`• ${row.name}: ${rupiah(row.amount)}`));
    return lines.join("\n");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildSummary());
      showToast("Rincian disalin!");
    } catch (_) {
      showToast("Gagal menyalin, salin manual ya.");
    }
  }

  /* ---------- Events ---------- */
  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => { state.mode = tab.dataset.mode; renderAll(); })
  );

  $("personForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("personName").value.trim();
    if (!name) return;
    addPerson(name);
    $("personName").value = "";
    $("personName").focus();
  });

  $("addItem").addEventListener("click", () => {
    state.items.push({ name: "", price: "", who: state.people.map((p) => p.id) });
    renderAll();
  });

  // Number inputs: update state and recompute without re-rendering the form
  [["totalInput", "total"], ["serviceInput", "service"], ["taxInput", "tax"], ["tipInput", "tip"]].forEach(([id, key]) =>
    $(id).addEventListener("input", () => { state[key] = $(id).value; save(); renderResults(); })
  );
  $("roundSelect").addEventListener("change", () => { state.roundTo = $("roundSelect").value; save(); renderResults(); });

  $$("[data-preset]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const preset = PRESETS[btn.dataset.preset];
      state.service = preset.service;
      state.tax = preset.tax;
      syncInputs();
      save();
      renderResults();
    })
  );

  $("copyButton").addEventListener("click", copySummary);
  $("waButton").addEventListener("click", () =>
    window.open("https://wa.me/?text=" + encodeURIComponent(buildSummary()), "_blank", "noopener")
  );

  $("resetButton").addEventListener("click", () => {
    state = defaultState();
    syncInputs();
    renderAll();
    showToast("Data direset.");
  });

  $("themeToggle").addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");
    $("themeToggle").textContent = dark ? "☀️" : "🌙";
    storageSet(THEME_KEY, dark ? "dark" : "light");
  });

  /* ---------- Startup ---------- */
  try {
    const saved = JSON.parse(storageGet(STORAGE_KEY));
    if (saved && Array.isArray(saved.people) && Array.isArray(saved.items)) state = { ...defaultState(), ...saved };
  } catch (_) {}

  if (storageGet(THEME_KEY) === "dark") {
    document.body.classList.add("dark");
    $("themeToggle").textContent = "☀️";
  }
  $("year").textContent = new Date().getFullYear();
  syncInputs();
  renderAll();
})();
