document
  .getElementById("sendCampaignBtn")
  .addEventListener("click", sendCampaign);

async function sendCampaign() {
  // Update status on the UI
  document.getElementById("campaignStatus").textContent = "Sending campaign...";
  document.getElementById("leadsSent").textContent = "0";
  document.getElementById("failedMessages").textContent = "0";

  try {
    const response = await fetch("http://localhost:3000/sendCampaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const results = await response.json();

      // Update the status dashboard
      let leadsSent = 0;
      let failedMessages = 0;

      results.forEach((result) => {
        if (result.status === "sent") {
          leadsSent++;
        } else {
          failedMessages++;
        }
      });

      document.getElementById("campaignStatus").textContent = "Campaign sent!";
      document.getElementById("leadsSent").textContent = leadsSent;
      document.getElementById("failedMessages").textContent = failedMessages;
    } else {
      document.getElementById("campaignStatus").textContent =
        "Error sending campaign";
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("campaignStatus").textContent =
      "Error occurred while sending";
  }
}
