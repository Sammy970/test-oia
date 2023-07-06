const express = require("express");
const app = express();
const port = 3000;

app.set("trust proxy", true);

app.get("/abcd", (req, res) => {
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(ipAddress);
  res.redirect("http://test-oia.vercel.app/abcd?link=https://www.instagram.com/my_art_craft");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;