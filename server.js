const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const cheerio = require("cheerio");

app.set("trust proxy", true);

const codes = {}; // Object to store generated codes and their corresponding links

app.get("/generate", async (req, res) => {
  const link = req.query.link;
  const getCodes = req.query.codes;

  if (getCodes === "yes") {
    res.send(codes);
  }
  const code = generateCode();
  const ogMetadata = await fetchOGMetadata(link);
  const shortenedLink = `${req.protocol}://${req.get("host")}/${code}`;

  codes[code] = {
    link: link,
    ogMetadata: ogMetadata,
  }; // Save the link, ogMetadata, and the generated code

  res.send({ shortenedLink });
});

app.get("/:code", (req, res) => {
  const code = req.params.code;
  const codeData = codes[code];

  if (codeData) {
    const { link, ogMetadata } = codeData;
    const html = generateHTMLWithOGMetadata(link, ogMetadata);

    // Set the content type to "text/html"
    res.set("Content-Type", "text/html");

    // Send the HTML response with the Open Graph metadata
    res.send(html);
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

async function fetchOGMetadata(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const ogMetadata = {};

    $("head meta[property^='og:']").each((index, element) => {
      const property = $(element).attr("property");
      const content = $(element).attr("content");
      ogMetadata[property] = content;
    });

    return ogMetadata;
  } catch (error) {
    console.error("Error fetching Open Graph metadata:", error);
    return null;
  }
}

function generateHTMLWithOGMetadata(link, ogMetadata) {
  if (!ogMetadata) {
    return `<html><head><meta http-equiv="refresh" content="0; url=${link}" /></head></html>`;
  }

  const metaTags = Object.entries(ogMetadata)
    .map(
      ([property, content]) =>
        `<meta property="${property}" content="${content}" />`
    )
    .join("\n");

  const html = `
    <html>
      <head>
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
