export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { image, mediaType, categoryNames } = req.body;

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
text: `You are a receipt parser. Extract every line item from this receipt and assign each one to exactly one of these YNAB budget categories: ${categoryNames || 'Groceries, Household Supplies, House Projects, Health, Pet Expenses, Clothes'}.

If the receipt includes sales tax, you MUST distribute it proportionally across all items. Follow these steps exactly:
1. Find the subtotal (pre-tax total) and tax amount
2. Calculate the tax multiplier: total / subtotal
3. For each item, multiply its pre-tax price by the tax multiplier
4. Return the tax-adjusted price for every item — never the pre-tax price
5. Double-check that all item prices sum to the receipt total before responding

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
