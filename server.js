const express = require("express");
const app = express();
const port = 3000;

app.set("trust proxy", true);

const codes = {}; // Object to store generated codes and their corresponding links

app.get("/generate", (req, res) => {
  const link = req.query.link;
  const code = generateCode();

  codes[code] = link; // Save the link with the generated code

  res.send({ code });
});

app.get("/:code", (req, res) => {
  const code = req.params.code;
  const link = codes[code];

  if (link) {
    // Redirect to the original link
    res.redirect(link);
  } else {
    // Code not found
    res.status(404).send("Code not found");
  }
});

function generateCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
