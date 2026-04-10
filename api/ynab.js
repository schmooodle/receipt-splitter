export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const YNAB_PAT = process.env.YNAB_PAT;
  const BUDGET_ID = "f1ba5c37-6cf5-45cb-b67d-9c437cf91bd5";

  const { action, transaction } = req.body || {};

  try {
    // Fetch categories
    if (action === "getCategories") {
      const response = await fetch(
        `https://api.ynab.com/v1/budgets/${BUDGET_ID}/categories`,
        { headers: { Authorization: `Bearer ${YNAB_PAT}` } }
      );
      const data = await response.json();
console.log('YNAB response:', JSON.stringify(data).slice(0, 200));
const categories = data.data.category_groups
        .filter(g => !g.hidden && !g.deleted && g.name !== "Internal Master Category" && g.name !== "Credit Card Payments")
        .flatMap(g => g.categories
          .filter(c => !c.hidden && !c.deleted)
          .map(c => ({ id: c.id, name: c.name, group: g.name }))
        );
      return res.status(200).json({ categories });
    }

    // Fetch accounts
    if (action === "getAccounts") {
      const ACCOUNTS = [
        { id: "88528ad4-93eb-494a-b787-4edaa04256e1", name: "Bank of America Card" },
        { id: "bf38ccc2-d06b-442e-8ebb-caa770780535", name: "Amex Card" },
        { id: "fad9f1ec-00e9-4e5a-8f68-4211a0b5d6ff", name: "Chase Card" }
      ];
      return res.status(200).json({ accounts: ACCOUNTS });
    }

    // Post transaction
    if (action === "postTransaction") {
      const response = await fetch(
        `https://api.ynab.com/v1/budgets/${BUDGET_ID}/transactions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${YNAB_PAT}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ transaction })
        }
      );
      const data = await response.json();
console.log('YNAB post response:', JSON.stringify(data).slice(0, 500));
return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}