console.log("reloaded!");

document
  .getElementById("sendCampaignBtn")
  .addEventListener("click", function (e) {
    e.preventDefault();
    setTimeout(() => {
      console.log("Page should not reload!");
      sendCampaign();
    }, 0);
  });

const dashboardTable = document.getElementById("campaignDetails");
const tbody = dashboardTable.querySelector("tbody");

if (tbody.rows.length === 0) {
  dashboardTable.style.display = "none"; // Hide the table
} else {
  dashboardTable.style.display = "table"; // Show the table
}

async function sendCampaign() {
  tbody.innerHTML = "";
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
        const newRow = document.createElement("tr");
        const name = document.createElement("td");
        name.innerHTML = result.name;
        const status = document.createElement("td");
        status.innerHTML = result.status;

        newRow.appendChild(name);
        newRow.appendChild(status);

        tbody.appendChild(newRow);
      });

      document.getElementById("campaignStatus").textContent = "Campaign sent!";
      document.getElementById("leadsSent").textContent = leadsSent;
      document.getElementById("failedMessages").textContent = failedMessages;
    } else {
      document.getElementById("campaignStatus").textContent =
        "Error sending campaign";
    }
    if (tbody.rows.length === 0) {
      dashboardTable.style.display = "none"; // Hide the table
    } else {
      dashboardTable.style.display = "table"; // Show the table
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("campaignStatus").textContent =
      "Error occurred while sending";
  }
}
