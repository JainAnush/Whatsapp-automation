const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const fsPromises = require("fs/promises");
const { getRandomTemplate } = require("./messageTemplates");

require("dotenv").config({ path: __dirname + "/.env" });
const twilio = require("twilio");

console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Token:", process.env.TWILIO_AUTH_TOKEN);

const app = express();
const PORT = 3000;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
    console.log("leads", leads);
    for (const lead of leads) {
      const personalizedMessage = getRandomTemplate(lead.name, lead.interest);
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

    // Write all logs once at the end
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
    const from = req.body.From; // format: whatsapp:+91XXXX
    const body = req.body.Body;

    console.log(`Received message from ${from}: ${body}`);

    // Update followupStatus.json here with hasResponded = true
    // (we can build this logic next)

    res.sendStatus(200);
  }
);

// Load leads on server start
loadLeads().then((result) => {
  leads = result;
});

function sendWhatsAppMessage(to, message) {
  return client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `whatsapp:${to}`,
    body: message,
  });
}

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
