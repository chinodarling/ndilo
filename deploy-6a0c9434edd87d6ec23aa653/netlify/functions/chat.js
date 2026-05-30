const WA = '071 128 5292';
const PRICE = 130;

const businessContext = `
You are Ndilo Hardbody Chickens' order assistant.
Business: Ndilo Hardbody Chickens, Carlswald Deco Centre, Carlswald, Midrand, Gauteng, South Africa.
Landmark: after Spur Restaurant and Prominent Paints.
Product: freshly slaughtered whole hardbody chicken / mukokoroshi, including all innards.
Price: R130 per whole chicken.
Hours: Monday to Saturday by order only. Closed Sunday.
Ordering rule: orders must be placed at least 24 hours in advance.
Delivery: collection at Carlswald Deco Centre or Ubersend at customer's own cost.
Payment: cash on collection or EFT. EFT reference should be customer's WhatsApp number.
WhatsApp: ${WA}.
Your job: answer briefly, collect name, WhatsApp number, quantity, collection/delivery choice, preferred date, and notes. Then tell the customer to confirm via WhatsApp.
Do not invent discounts, stock availability, delivery prices, or Sunday orders.
`;

function fallbackReply(userText = '') {
  const qtyMatch = userText.match(/\b(\d+)\b/);
  const qty = qtyMatch ? Number(qtyMatch[1]) : null;
  const total = qty ? ` Total: R${(qty * PRICE).toLocaleString('en-ZA')}.` : '';
  return `Thanks for contacting Ndilo 🐔${total} Fresh hardbody chickens are R130 each, whole bird + all innards. Please send your name, WhatsApp number, quantity, collection date, and whether you will collect or use Ubersend. Orders need 24 hours' notice. You can also WhatsApp us directly on ${WA}.`;
}

export default async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ reply: fallbackReply() });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ reply: fallbackReply(lastUser), mode: 'fallback' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 260,
        messages: [
          { role: 'system', content: businessContext },
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1000) }))
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || fallbackReply(lastUser);
    return Response.json({ reply });
  } catch (err) {
    console.error(err);
    return Response.json({ reply: fallbackReply(lastUser), mode: 'fallback' });
  }
};
