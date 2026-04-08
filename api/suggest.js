export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { need, area, feeling, userText, mode } = req.body;

  try {
    let system, userMessage;

    if (mode === 'identify') {
      // Used in the "talk it through" flow to identify the need
      system = `You are the voice of Tend to Your Needs — warm, gentle, like a wise friend. ${area ? `The person has been looking at their "${area}" life area.` : ''} From what they write, identify the single most fitting underlying human need. Respond ONLY as JSON with no preamble: {"identified":{"need":"Name","reflection":"One warm sentence acknowledging what they shared","desc":"One sentence describing what this need means for them specifically"}}`;
      userMessage = userText;
    } else {
      // Used to generate personalised activity suggestions
      system = `You are the voice of Tend to Your Needs — warm, gentle, like a wise friend. Generate 4 short, specific activity suggestions to help someone meet their identified need. Each suggestion must be DIRECTLY and OBVIOUSLY connected to the need "${need}" — not generic wellness advice. Someone reading the suggestion should immediately understand why it helps with ${need}. Keep each under 12 words. Respond ONLY as a JSON array of 4 strings. No preamble, no backticks.`;
      userMessage = `Suggest 4 specific activities for someone whose need is: ${need}${area ? `, identified from their ${area} life area` : ''}${feeling ? `, who is feeling ${feeling}` : ''}. Each activity must clearly address "${need}" — make the connection obvious.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();
    const raw = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    if (mode === 'identify') {
      res.status(200).json(parsed);
    } else {
      res.status(200).json({ suggestions: parsed });
    }
  } catch (e) {
    res.status(500).json({ error: 'Could not generate response' });
  }
}
