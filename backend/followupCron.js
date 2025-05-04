const cron = require("node-cron");
const db = require("./db"); // our SQLite setup
const { sendWhatsAppMessage } = require("./sendWhatsappMessage"); // adjust path
const { getRandomTemplate } = require("./messageTemplates");

const FOLLOWUP_DELAY_SECONDS = parseInt(
  process.env.FOLLOWUP_DELAY_SECONDS || "86400"
);

// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("🔁 Running follow-up check...");

  const now = new Date();
  const threshold = new Date(
    now.getTime() - FOLLOWUP_DELAY_SECONDS * 1000
  ).toISOString();

  const candidates = db
    .prepare(
      `SELECT * FROM followups 
       WHERE hasResponded = 0 
         AND followupCount < 2 
         AND status != 'not_interested' 
         AND lastUpdated <= ?`
    )
    .all(threshold);

  for (const lead of candidates) {
    try {
      const message = `Hi again! Just following up on our previous message. Let me know your thoughts.`;
      await sendWhatsAppMessage(lead.phone, message);

      const newCount = lead.followupCount + 1;
      const newStatus = newCount >= 2 ? "not_interested" : "followed_up";

      db.prepare(
        `UPDATE followups SET 
          followupCount = ?, 
          status = ?, 
          lastUpdated = ? 
         WHERE id = ?`
      ).run(newCount, newStatus, new Date().toISOString(), lead.id);

      console.log(`📨 Followed up with ${lead.phone}. Count: ${newCount}`);
    } catch (err) {
      console.error(`❌ Follow-up failed for ${lead.phone}:`, err.message);
    }
  }
});
