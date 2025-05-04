const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const fsPromises = require("fs/promises");
const { getRandomTemplate } = require("./messageTemplates");
const db = require("./db");

const cors = require("cors");

require("dotenv").config({ path: __dirname + "/.env" });
const { sendWhatsAppMessage } = require("./sendWhatsappMessage");

console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Token:", process.env.TWILIO_AUTH_TOKEN);

const FOLLOWUP_DELAY_SECONDS = parseInt(
  process.env.FOLLOWUP_DELAY_SECONDS || "86400"
); // default 24hrs

const app = express();

app.use(cors());
const PORT = 3000;

let leads = [];
// Load leads from CSV
function loadLeads() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream("./backend/leads.csv")
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => {
        console.log(`Loaded ${results.length} leads`);
        resolve(results);
      })
      .on("error", reject);
  });
}

function recordCampaign(phone, campaignId) {
  // Check if a record already exists for this campaign and phone
  const row = db
    .prepare("SELECT * FROM followups WHERE phone = ? AND campaignId = ?")
    .get(phone, campaignId);

  if (!row) {
    // First time sending this campaign to this user
    db.prepare(
      `
      INSERT INTO followups (phone, campaignId, hasResponded, followupCount, status)
      VALUES (?, ?, 0, 0, 'pending')
      `
    ).run(phone, campaignId);
    console.log(`Campaign ${campaignId} inserted for ${phone}`);
  } else {
    console.log(`Campaign ${campaignId} already recorded for ${phone}`);
  }
}

// API endpoint to print message previews
app.get("/preview-messages", (req, res) => {
  const previews = leads.map((lead) => ({
    name: lead.name,
    phone: lead.phone,
    message: getRandomTemplate(lead.name, lead.interest),
  }));
  res.json(previews);
});

app.post("/sendCampaign", async (req, res) => {
  try {
    const results = [];
    const logs = [];
    const campaignId = `campaign-${Date.now()}`; // unique ID for this campaign

    console.log("leads", leads);
    for (const lead of leads) {
      const personalizedMessage = getRandomTemplate(lead.name, lead.interest);

      // ✅ Track in SQLite
      recordCampaign(lead.phone, campaignId);

      try {
        console.log(
          `📤 Sending message to ${lead.phone}: "${personalizedMessage}"`
        );
        const result = await sendWhatsAppMessage(
          lead.phone,
          personalizedMessage
        );
        results.push({ name: lead.name, status: "sent", sid: result.sid });
        logs.push({
          timestamp: new Date().toISOString(),
          name: lead.name,
          phone: lead.phone,
          message: personalizedMessage,
          status: "sent",
        });
        console.log("message sent", results);
      } catch (err) {
        console.error(`❌ Failed for ${lead.name}:`, err.message);
        results.push({ name: lead.name, status: "failed", error: err.message });
        logs.push({
          timestamp: new Date().toISOString(),
          name: lead.name,
          phone: lead.phone,
          message: personalizedMessage,
          status: "failed",
        });
      }
    }

    await writeLogBatch(logs);
    res.json(results);
  } catch (err) {
    console.error("🔥 Error in sendCampaign:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post(
  "/incoming-message",
  express.urlencoded({ extended: false }),
  (req, res) => {
    const from = req.body.From.replace("whatsapp:", "");
    const messageBody = req.body.Body;

    // Find all pending campaigns for this phone
    const pendingCampaigns = db
      .prepare("SELECT * FROM followups WHERE phone = ? AND hasResponded = 0")
      .all(from);

    console.log("pending campaigns", pendingCampaigns);

    for (const campaign of pendingCampaigns) {
      db.prepare(
        `
      UPDATE followups
      SET hasResponded = 1,
          status = 'responded',
          lastUpdated = CURRENT_TIMESTAMP
      WHERE id = ?
    `
      ).run(campaign.id);
    }

    console.log(
      `Received reply from ${from}: "${messageBody}" — marked all pending as responded.`
    );
    res.sendStatus(200);
  }
);

// Load leads on server start
loadLeads().then((result) => {
  leads = result;
});

async function writeLogBatch(logsToWrite) {
  const logFile = path.join(__dirname, "log.json");

  try {
    let existingLogs = [];

    if (fs.existsSync(logFile)) {
      const content = (await fsPromises.readFile(logFile, "utf-8")).trim();
      existingLogs = content ? JSON.parse(content) : [];
    }

    const updatedLogs = existingLogs.concat(logsToWrite);

    await fsPromises.writeFile(logFile, JSON.stringify(updatedLogs, null, 2));
    console.log("✅ All logs written.");
  } catch (err) {
    console.error("❌ Failed to write logs:", err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

require("./followupCron");
