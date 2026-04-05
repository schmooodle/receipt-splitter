export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { image, mediaType } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image },
              },
              {
                type: "text",
text: `You are a receipt parser. Extract every line item from this receipt and assign each one to exactly one of these YNAB budget categories: House Projects, Clothes, Health, Pet Expenses, Groceries, Household Supplies.

If the receipt includes sales tax, distribute it proportionally across all items based on each item's share of the subtotal. Each item's price in the output should be its tax-adjusted price (pre-tax price × total / subtotal). The sum of all item prices must equal the receipt total exactly.

Return ONLY valid JSON in this exact format, no explanation:
{
  "store": "store name",
  "date": "date if visible",
  "subtotal": 00.00,
  "tax": 00.00,
  "total": 00.00,
  "items": [
    { "name": "item name", "price": 0.00, "category": "Category Name" }
  ]
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    res.status(200).json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
