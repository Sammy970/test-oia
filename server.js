// Importing Dependencies
const express = require("express");
const { nanoid } = require("nanoid");
const axios = require("axios");
const cheerio = require("cheerio");
const ogs = require("open-graph-scraper");

const metascraper = require("metascraper")([
  require("metascraper-description")(),
  require("metascraper-title")(),
  require("metascraper-url")(),
  require("metascraper-image")(),
  require("metascraper-logo")(),
  require("metascraper-author")(),
]);
const got = require("got");

// Important Settings
const app = express();
const port = 3000;

// App Sets
app.set("trust proxy", true);

// Object to store generated codes and their corresponding links
const codes = {};

// app.get("/", (req, res) => {
//   res.send("good");
// });

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

    console.log(ogMetadata);

    return ogMetadata;
  } catch (error) {
    console.error("Error fetching Open Graph metadata:", error);
    return null;
  }
}

// async function fetchOGMetadata(url) {
//   try {
//     const options = { url };
//     const { result } = await ogs(options);
//     // const ogMetadata = result ? result.ogTitle : null;

//     console.log(result);

//     return result;
//   } catch (error) {
//     console.error("Error fetching Open Graph metadata:", error);
//     return null;
//   }
// }

// async function fetchOGMetadata(url) {
//   try {
//     const { body: html, url: finalUrl } = await got(url);
//     const metadata = await metascraper({ html, url: finalUrl });

//     console.log(metadata);

//     return metadata;
//   } catch (error) {
//     console.error("Error fetching Open Graph metadata:", error);
//     return null;
//   }
// }

function generateHTMLWithOGMetadata(link, ogMetadata) {
  if (!ogMetadata) {
    return `<html><head><meta http-equiv="refresh" content="0; url=${link}" /></head></html>`;
  }

  let metaTags = "";

  for (const property in ogMetadata) {
    if (Object.hasOwnProperty.call(ogMetadata, property)) {
      const content = ogMetadata[property];
      // console.log(content);
      metaTags += `<meta property="${property}" content="${content}" />`;
    }
  }

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
