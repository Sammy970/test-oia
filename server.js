const express = require("express");
const app = express();
const port = 3000;

app.set("trust proxy", true);

app.get("/abcd", (req, res) => {
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(ipAddress);
  res.redirect("https://www.linkedin.com/in/samyak-jain-3a6639172/");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;