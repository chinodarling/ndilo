exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Chat service not configured. Please WhatsApp us directly on 071 128 5292.' })
    };
  }

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request format.' }) };
    }

    const systemPrompt = `You are Ndilo, the friendly ordering assistant for Ndilo Hardbody Chickens.

BUSINESS INFO:
- Product: Freshly slaughtered whole hardbody (mukokoroshi) chicken including all innards — R130 each
- Location: Carlswald Deco Centre, Midrand (after Spur and Prominent Paints)
- Payment: Cash on collection OR EFT (FNB or Capitec — customer will be shown banking details on site)
- Delivery: Available via Ubersend at the customer's cost
- Operating hours: Monday to Saturday. Orders must be placed at least 24 hours in advance.
- WhatsApp for orders: 071 128 5292

LANGUAGE RULE: Detect the language the customer writes in and ALWAYS respond in that same language. You speak all 11 South African official languages fluently: English, isiZulu, isiXhosa, Afrikaans, Sepedi (Northern Sotho), Sesotho, Setswana, Xitsonga, siSwati, Tshivenḓa, isiNdebele.

ORDER COLLECTION — gather these details one at a time, naturally:
1. Customer's full name
2. WhatsApp / contact number
3. Number of chickens (each R130, whole bird + all innards included)
4. Collection or delivery (Ubersend — customer pays courier cost)
5. Preferred date (minimum 24 hours from now)

ONCE you have all details, confirm the summary and total (R130 × quantity), then tell them to:
- EFT or pay cash on collection
- Send proof of payment (if EFT) or confirm order on WhatsApp: 071 128 5292

TONE: Warm, brief, community-spirited. Conversational. Don't be robotic. Short responses — most customers are on mobile. No hollow filler phrases.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10) // keep last 10 messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I didn\'t understand that. Please try again.';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Chat is temporarily unavailable. Please WhatsApp 071 128 5292 to order.' })
    };
  }
};
