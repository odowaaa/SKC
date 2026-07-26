export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  // Honeypot: if filled, silently accept to slow bots
  if (data.hp && String(data.hp).trim() !== '') {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const name = String(data.name || '').trim().slice(0, 200);
  const email = String(data.email || '').trim().slice(0, 200);
  const phone = String(data.phone || '').trim().slice(0, 50);
  const message = String(data.message || '').trim().slice(0, 3000);
  const type = String(data.type || 'contact').slice(0, 50);

  if (!email && !phone) {
    return new Response(JSON.stringify({ error: 'Please provide an email or phone number.' }), { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 400 });
  }

  const recipients = ['info@skc.college', 'Engodwa99@gmail.com'];
  const subject = `[SKC ${type}] New submission from ${name || email || phone}`;
  const plainContent = [
    `Type: ${type}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Message:\n${message}`
  ].join('\n\n');

  const sgBody = {
    personalizations: [{ to: recipients.map(r => ({ email: r })), subject }],
    from: { email: 'info@skc.college', name: 'SomaliKing College' },
    content: [{ type: 'text/plain', value: plainContent }]
  };

  const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server not configured.' }), { status: 500 });
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sgBody)
  });

  if (!res.ok) {
    const info = await res.text();
    return new Response(JSON.stringify({ error: 'Failed to send email', info }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
