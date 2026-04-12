export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { need, area, feeling, planItems, rituals } = req.body;

  try {
    const activitiesText = planItems && planItems.length
      ? `They have chosen these activities to tend to this need: ${planItems.slice(0, 4).join('; ')}.`
      : '';

    const ritualsText = rituals && rituals.length
      ? `Their regular rituals include: ${rituals.slice(0, 5).join(', ')}.`
      : '';

    const system = `You are the voice of Tend to Your Needs — warm, gentle, like a wise friend. Generate a gentle daily schedule to help someone tend to their need for "${need}". Create exactly 4 time slots: Morning, Midday, Afternoon, and Evening. Each activity should be specific, achievable, and directly connected to the need. Draw from their chosen activities and rituals where possible. Keep titles under 10 words. Keep "why" to one warm, specific sentence.

Respond ONLY as JSON with no preamble or backticks:
{"schedule":[{"time":"Morning","timeRange":"7–9am","title":"activity title","why":"warm reason why this tends to the need","duration":"15 min"},{"time":"Midday","timeRange":"12–1pm","title":"...","why":"...","duration":"..."},{"time":"Afternoon","timeRange":"3–5pm","title":"...","why":"...","duration":"..."},{"time":"Evening","timeRange":"7–9pm","title":"...","why":"...","duration":"..."}]}`;

    const userMessage = `Build a gentle day plan for someone whose need is "${need}"${area ? ` (from their ${area} life area)` : ''}${feeling ? `, who is feeling ${feeling}` : ''}.${activitiesText ? ' ' + activitiesText : ''}${ritualsText ? ' ' + ritualsText : ''} Each slot should directly tend to the need for ${need} — make the connection clear and felt.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();
    const raw = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'Could not generate schedule' });
  }
}
