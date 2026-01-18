// /api/reminders.js

// Helpers
const toISODate = (d) => d.toISOString().slice(0, 10);
const addDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

// --------------
// CONFIG (edit these)
// --------------

// Fixed monthly payments by day-of-month.
// Note: if you have two payments on the same day, just add another entry.
const PAYMENTS = [
  // Bills
  { name: "Apple storage", amount: 8.99, day: 1 },
  { name: "Water", amount: 24.46, day: 26 },
  { name: "Gas", amount: 65.98, day: 27 },
  { name: "WiFi", amount: 24.0, day: 29 },

  { name: "Cat lenses", amount: 23.0, day: 3 },
  { name: "Gym (You)", amount: 26.0, day: 3 },

  { name: "Cat Apple", amount: 5.99, day: 5 },
  { name: "Amazon Prime", amount: 8.99, day: 6 },
  { name: "PRA (Monzo) min", amount: 15.0, day: 7 },
  { name: "Lowell min", amount: 10.0, day: 7 },

  { name: "Rent", amount: 407.56, day: 8 },
  { name: "Ionos", amount: 6.0, day: 8 },
  { name: "Cat gym", amount: 21.62, day: 9 },
  { name: "ChatGPT (half)", amount: 10.0, day: 9 },
  { name: "Figma AI", amount: 18.0, day: 9 },

  { name: "AO/NewDay", amount: 197.35, day: 10 },
  { name: "Sofa", amount: 76.5, day: 10 },

  { name: "Your phone", amount: 15.0, day: 11 },
  { name: "Council tax", amount: 70.28, day: 15 },

  { name: "Cat mobile", amount: 12.0, day: 20 },
  { name: "Electric", amount: 32.0, day: 21 },
  { name: "Intrum min", amount: 10.0, day: 21 },

  { name: "Ionos", amount: 5.4, day: 26 },

  // Lifestyle
  { name: "Badminton", amount: 70.0, day: 0 }, // set to 0 if not a fixed date
  { name: "Food (budget)", amount: 200.0, day: 0 } // set to 0 if you don't want it in reminders
];

// Fuel estimation (optional).
// If you don't want fuel included, set includeFuel=false.
const includeFuel = true;
const fuelCost = 47; // average per fill
const fuelIntervalDays = 4; // "every 3-4 days" -> use 4 as safe estimate
// Set lastFill date manually in YYYY-MM-DD (optional but recommended).
// Example: "2026-01-11"
// If empty, it will not add fuel reminders.
const lastFill = ""; // <-- set this when you fill up, or leave blank

function getPaymentsForDate(targetDate) {
  const dayOfMonth = targetDate.getDate();
  return PAYMENTS
    .filter((p) => p.day === dayOfMonth)
    .map((p) => ({ name: p.name, amount: Number(p.amount.toFixed(2)) }));
}

function getFuelForDate(targetDate) {
  if (!includeFuel) return [];
  if (!lastFill) return [];

  const start = new Date(lastFill + "T00:00:00.000Z");
  const target = new Date(toISODate(targetDate) + "T00:00:00.000Z");

  const diffDays = Math.round((target - start) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return [];

  // fuel due when diffDays is a multiple of interval
  if (diffDays % fuelIntervalDays === 0) {
    return [{ name: "Fuel (est)", amount: fuelCost }];
  }
  return [];
}

module.exports = (req, res) => {
  // Optional query param: ?days=7
  const days = Math.min(Math.max(parseInt(req.query.days || "7", 10), 1), 14);

  const now = new Date();
  const results = [];

  for (let i = 1; i <= days; i++) {
    const date = addDays(now, i);

    const items = [
      ...getPaymentsForDate(date),
      ...getFuelForDate(date)
    ];

    const total = Number(
      items.reduce((sum, x) => sum + x.amount, 0).toFixed(2)
    );

    results.push({
      in: i,
      date: toISODate(date),
      total,
      items
    });
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({
    generatedAt: new Date().toISOString(),
    currency: "GBP",
    fuel: includeFuel
      ? { enabled: true, cost: fuelCost, intervalDays: fuelIntervalDays, lastFill: lastFill || null }
      : { enabled: false },
    days: results
  });
};