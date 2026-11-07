/*
 * Pure calculation logic (no DOM). Easy to read and to test.
 *
 * Rules:
 *  1. Each person's "base" = their share of the bill before extras.
 *  2. Service is charged on the base.
 *  3. Tax is charged on base + service (common practice in Indonesian restaurants).
 *  4. Tip (a fixed amount) is split in proportion to each person's base.
 *  5. Each person's final amount is rounded UP to the chosen step.
 */
window.SplitCalc = (function () {
  /** Round up to a multiple of `step`, ignoring tiny floating point noise. */
  function roundUp(value, step) {
    if (step <= 1) return Math.round(value);
    return Math.ceil(Math.round(value * 100) / 100 / step) * step;
  }

  /** Sum of item prices per person. Each item is split equally among its people. */
  function itemBases(people, items) {
    const bases = Object.fromEntries(people.map((p) => [p.id, 0]));
    let unassigned = 0;

    items.forEach((item) => {
      const price = Number(item.price) || 0;
      const eaters = item.who.filter((id) => id in bases);
      if (!eaters.length) {
        unassigned += price;
        return;
      }
      eaters.forEach((id) => (bases[id] += price / eaters.length));
    });

    return { bases, unassigned };
  }

  /**
   * @param {object} input
   *   mode: "even" | "items", people: [{id, name}], total: number,
   *   items: [{price, who: [personId]}], servicePct, taxPct, tip, roundTo
   */
  function calculate(input) {
    const { mode, people, items, servicePct, taxPct, tip, roundTo } = input;
    let bases = {};
    let unassigned = 0;

    if (mode === "even") {
      const share = people.length ? (Number(input.total) || 0) / people.length : 0;
      people.forEach((p) => (bases[p.id] = share));
    } else {
      ({ bases, unassigned } = itemBases(people, items));
    }

    const subtotal = Object.values(bases).reduce((a, b) => a + b, 0);
    const service = (subtotal * servicePct) / 100;
    const tax = ((subtotal + service) * taxPct) / 100;
    const grand = subtotal + service + tax + tip;

    const rows = people.map((p) => {
      const base = bases[p.id];
      const ratio = subtotal > 0 ? base / subtotal : 0;
      const serviceShare = (base * servicePct) / 100;
      const taxShare = ((base + serviceShare) * taxPct) / 100;
      const tipShare = tip * ratio;
      const exact = base + serviceShare + taxShare + tipShare;
      return { id: p.id, name: p.name, base, amount: roundUp(exact, roundTo) };
    });

    const collected = rows.reduce((sum, r) => sum + r.amount, 0);
    return { subtotal, service, tax, tip, grand, rows, collected, unassigned };
  }

  return { calculate, roundUp };
})();
