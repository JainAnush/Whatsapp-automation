const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function sendWhatsAppMessage(to, message) {
  return client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `whatsapp:${to}`,
    body: message,
  });
}

module.exports = { sendWhatsAppMessage };
