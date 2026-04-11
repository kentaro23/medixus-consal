const { Resend } = require("resend");

const MAX_MESSAGE_LENGTH = 4000;

function sanitize(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function validateBody(body) {
  const company = sanitize(body.company);
  const name = sanitize(body.name);
  const email = sanitize(body.email).toLowerCase();
  const employees = sanitize(body.employees);
  const interest = sanitize(body.interest);
  const message = sanitize(body.message);

  if (!company || !name || !email || !employees || !interest || !message) {
    return { ok: false, error: "必須項目が不足しています。" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "メールアドレスの形式が不正です。" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "お問い合わせ内容が長すぎます。" };
  }

  return {
    ok: true,
    payload: { company, name, email, employees, interest, message },
  };
}

async function sendViaResend(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "ohara.kentaro@medixus.co.jp";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    return { data: null, error: { message: "RESEND_API_KEY is not set" } };
  }

  const resend = new Resend(apiKey);
  const subject = `【medixus consulting】新規お問い合わせ: ${payload.company} / ${payload.name}`;

  const text = [
    "medixus consulting お問い合わせフォームから新規送信がありました。",
    "",
    `会社名: ${payload.company}`,
    `お名前: ${payload.name}`,
    `メール: ${payload.email}`,
    `従業員数: ${payload.employees}`,
    `関心コース: ${payload.interest}`,
    "",
    "お問い合わせ内容:",
    payload.message,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 16px;">medixus consulting お問い合わせ通知</h2>
      <p><strong>会社名:</strong> ${payload.company}</p>
      <p><strong>お名前:</strong> ${payload.name}</p>
      <p><strong>メール:</strong> ${payload.email}</p>
      <p><strong>従業員数:</strong> ${payload.employees}</p>
      <p><strong>関心コース:</strong> ${payload.interest}</p>
      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #E5E7EB;" />
      <p><strong>お問い合わせ内容</strong></p>
      <p style="white-space: pre-wrap;">${payload.message}</p>
    </div>
  `;

  return resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    replyTo: payload.email,
    subject,
    text,
    html,
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const validation = validateBody(req.body || {});
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { data, error } = await sendViaResend(validation.payload);
  if (error) {
    console.error("[contact-api-error]", error);
    return res.status(500).json({
      error: "送信に失敗しました。時間をおいて再度お試しください。",
    });
  }

  return res.status(200).json({ ok: true, id: data?.id || null });
}
