const cron = require("node-cron");
const db = require("./db");
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

  // Directly execute the query using db.all()
  db.all(
    `SELECT * FROM followups 
     WHERE hasResponded = 0 
       AND followupCount < 2 
       AND status != 'not_interested' 
       AND lastUpdated <= ?`,
    [threshold], // Pass threshold as a parameter
    async (err, candidates) => {
      if (err) {
        console.error("Error fetching candidates:", err.message);
        return;
      }

      console.log("candidates", candidates);

      for (const lead of candidates) {
        try {
          const message = `Hi again! Just following up on our previous message. Let me know your thoughts.`;
          const followupResult = await sendWhatsAppMessage(lead.phone, message);

          console.log("followup result", followupResult);

          const newCount = lead.followupCount + 1;
          const newStatus = newCount >= 2 ? "not_interested" : "followed_up";

          // Update follow-up details in the database
          db.run(
            `UPDATE followups SET 
              followupCount = ?, 
              status = ?, 
              lastUpdated = ? 
             WHERE id = ?`,
            [newCount, newStatus, new Date().toISOString(), lead.id], // Pass parameters directly
            (err) => {
              if (err) {
                console.error(
                  `❌ Failed to update follow-up for ${lead.phone}:`,
                  err.message
                );
              } else {
                console.log(
                  `📨 Followed up with ${lead.phone}. Count: ${newCount}`
                );
              }
            }
          );
        } catch (err) {
          console.error(`❌ Follow-up failed for ${lead.phone}:`, err.message);
        }
      }
    }
  );
});
