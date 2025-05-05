const express = require("express");
const path = require("path");
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.listen(5500, () => {
  console.log("Frontend server running at http://localhost:5500");
});
