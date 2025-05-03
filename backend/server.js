const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
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

let leads = [];

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
  if (leads.length === 0) {
    leads = await loadLeads(); // Ensure leads are loaded
  }

  const results = [];

  for (const lead of leads) {
    const personalizedMessage = getRandomTemplate(lead.name, lead.interest);
    try {
      const result = await sendWhatsAppMessage(lead.phone, personalizedMessage);
      results.push({ name: lead.name, status: "sent", sid: result.sid });
      logMessage(lead.name, lead.phone, personalizedMessage, "sent");
    } catch (err) {
      console.error(`Failed for ${lead.name}:`, err.message);
      results.push({ name: lead.name, status: "failed", error: err.message });
      logMessage(lead.name, lead.phone, personalizedMessage, "failed");
    }
  }

  res.json(results); // <-- This should now return the array as expected
});

// Load leads on server start
loadLeads();

function sendWhatsAppMessage(to, message) {
  return client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `whatsapp:${to}`,
    body: message,
  });
}

function logMessage(name, phone, message, status) {
  const log = {
    timestamp: new Date().toISOString(),
    name,
    phone,
    message,
    status,
  };

  const logFile = path.join(__dirname, "log.json");
  let existingLogs = [];

  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, "utf-8").trim();
      existingLogs = content ? JSON.parse(content) : [];
    }
  } catch (err) {
    console.error(
      "⚠️ Failed to read or parse log.json. Initializing empty log. Error:",
      err.message
    );
    existingLogs = [];
  }

  existingLogs.push(log);

  try {
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
    console.log("✅ Log written to log.json");
  } catch (err) {
    console.error("❌ Failed to write log.json:", err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
