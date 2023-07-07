// Importing Dependencies
const express = require("express");
const { nanoid } = require("nanoid");

// Importing Function
const { fetchOGMetadata } = require("./functions");

// Important Settings
const app = express();
const port = 3000;

// App Sets
app.set("trust proxy", true);

// Object to store generated codes and their corresponding links
const codes = {};

app.get("/", (req, res) => {
  res.send("good");
});

app.get("/generate", async (req, res) => {
  const link = req.query.link;
  const getCodes = req.query.codes;

  if (getCodes === "yes") {
    res.send(codes);
  } else {
    const code = nanoid(4);
    const ogMetadata = await fetchOGMetadata(link);
    const shortenedLink = `${req.protocol}://${req.get("host")}/${code}`;

    codes[code] = {
      link: link,
      ogMetadata: ogMetadata,
    }; // Save the link, ogMetadata, and the generated code

    res.send({ shortenedLink });
  }
});

app.get("/:code", (req, res) => {
  const code = req.params.code;
  const codeData = codes[code];

  if (codeData) {
    const { link, ogMetadata } = codeData;
    const html = generateHTMLWithOGMetadata(link, ogMetadata);

    console.log(html);

    // Set the content type to "text/html"
    res.set("Content-Type", "text/html");

    // Send the HTML response with the Open Graph metadata
    res.send(html);
  } else {
    // Code not found
    res.status(404).send("Code not found");
  }
});

function generateHTMLWithOGMetadata(link, ogMetadata) {
  if (!ogMetadata) {
    return `<html><head><meta http-equiv="refresh" content="0; url=${link}" /></head></html>`;
  }

  const metaTags = Object.entries(ogMetadata)
    .map(
      ([property, content]) =>
        `<meta property="${property}" content='${content}' />`
    )
    .join("\n");

  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        ${metaTags}
      </head>
      <body>
        <p>Redirecting...</p>
        <script>
          window.location.href = "${link}";
        </script>
      </body>
    </html>
  `;

  return html;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
