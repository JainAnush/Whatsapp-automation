# WhatsApp Automation

A simple WhatsApp automation tool for sending bulk messages with follow-ups and tracking responses using Twilio API. This project involves sending personalized campaigns, following up on non-responding users, and tracking the status of each campaign.

## 📁 Project Structure

```
/whatsapp-automation
├── /backend
│   ├── server.js
│   ├── db.js
│   ├── sendWhatsappMessage.js
│   ├── messageTemplates.js
│   └── logs.json
│   └── .env
|   └── followups.db
|   └── leads.csv
├── /frontend
│   └── /public
│   |   ├── index.html
│   |   ├── styles.css
│   |   └── app.js
│   └── frontend.js
└── .gitignore
└── package.json
└── readme.md
```

## ✨ Features

- ✅ Campaign Sending
- 🔁 Auto Follow-ups (every minute)
- 📊 Campaign Status Tracking
- 🌐 Simple Web Dashboard (via frontend)

## 🔧 Requirements

- Node.js (v14 or later)
- SQLite3
- Twilio Account (for WhatsApp messaging)
- Lead list with `name`, `phone`, and `interest` fields

## 🚀 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/JainAnush/Whatsapp-automation.git
cd whatsapp-automation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env` file:

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
FOLLOWUP_DELAY_SECONDS=86400
```

### 4. Serve the Frontend

Frontend files are in `/frontend/public`.
to serve them via a express server run:

```bash
node frontend.js
```

### 5. Start the backend Server

```bash
node backend/server.js
```

The backend runs on `http://localhost:3000`.
The frontend runs on `http://localhost:5500`.

## 📬 Sending a Campaign

- Click the **Send Campaign** button in the frontend interface.
- Personalized WhatsApp messages will be sent using Twilio.
- Backend records the campaign and manages follow-ups.

## 🧠 How It Works

- A campaign ID is generated when `/sendCampaign` is hit.
- For each lead:
  - A message is selected from a template.
  - The message is sent using Twilio.
  - The campaign is logged in the `followups` SQLite table.
- A cron job checks every minute:
  - If users haven’t responded after the specified delay.
  - Sends up to 2 follow-ups per campaign.
  - Marks user as `not_interested` after 2 follow-ups.
- The logs for sent and failed messages are logged in backend/logs.json file.

## 🛠 File Descriptions

- **`server.js`** – Express server & cron job for follow-ups
- **`db.js`** – SQLite setup and schema for `followups`
- **`sendWhatsappMessage.js`** – Twilio WhatsApp messaging logic
- **`messageTemplates.js`** – Returns random personalized templates
- **`frontend/public/`** – HTML + JS interface to trigger campaigns

## 🐞 Troubleshooting

- **DB Not Updating**: Ensure `followups` table exists and `INSERT` statements succeed.
- **No Follow-ups**: Check if the cron job is running every minute.
- **Twilio Errors**: Double-check your `.env` values.

## Next steps I would take if I had 2 more days

- Personalized Message Generation using GPT

  - Implement a GPT-based model to dynamically generate personalized messages for each lead based on their profile data (e.g., name, interest, location). This will make messages more engaging and tailored, improving response rates.

- Intent Recognition from Replies

  - Use Natural Language Processing (NLP) to classify the intent behind a lead's response. For example, categorize responses as Interested, Uninterested, or Request for Information. This will allow you to adjust follow-up strategies accordingly.

  - Automatically stop follow-ups if a lead responds with a "stop" or "unsubscribe" message.

- Sentiment Analysis on Responses

  - Implement sentiment analysis to detect whether a lead's response is positive, negative, or neutral. Based on the sentiment, the system can decide whether to push for further engagement or mark the lead as "not interested."

  - For example, if a user responds with "Not now, but maybe later," the system could tag them as "follow-up later."

- Smart Campaign Replies using RAG

  - Enhance your WhatsApp campaigns by integrating Retrieval-Augmented Generation (RAG) to automatically generate intelligent, personalized replies to user responses.

  - When a user replies to a campaign message, RAG fetches relevant information from a knowledge base (e.g., FAQs, service offerings, pricing, etc.).

  - It then generates a contextual, human-like response using a language model (e.g., GPT-3.5).

  - This helps handle common inquiries automatically, reduces manual workload, and keeps leads engaged effectively.
