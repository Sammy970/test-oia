// Importing Dependencies
const express = require("express");
const { nanoid } = require("nanoid");
const axios = require("axios");
const cheerio = require("cheerio");

//Importing MongoDriver
const { MongoClient } = require("mongodb");
// const URI = "mongodb+srv://samyakjain:samyak%40123@oia-db.2ueqlzg.mongodb.net/";
const URI = process.env.MONGODB_URI;

const client = new MongoClient(URI);

// Important Settings
const app = express();
const port = 3000;

// App Sets
app.set("trust proxy", true);

// Object to store generated codes and their corresponding links
const codes = {};

app.get("/", async (req, res) => {
  console.log(process.env.MONGODB_URI);
  await client.connect();
  const database = client.db("Data");
  const collection = database.collection("getCodes");

  const data = await collection.findOne({ "4asdsd4d": { $exists: true } });
  res.send(data);
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

    try {
      await client.connect();
      const database = client.db("Data");
      const collection = database.collection("getCodes");

      const newData = {
        _id: nanoid(24), // Generate a new ObjectId for the document
        [code]: {
          link: link,
          ogMetadata,
        },
      };

      console.log(newData);

      await collection.insertOne(newData);

      await client.close();
    } catch (error) {
      console.log("MongoDB Error", error);
    } finally {
      res.send({ shortenedLink });
    }
  }
});

app.get("/:code", async (req, res) => {
  const code = req.params.code;

  let link;
  let ogMetadata;

  try {
    await client.connect();
    const database = client.db("Data");
    const collection = database.collection("getCodes");

    const data = await collection.findOne({ [code]: { $exists: true } });

    link = data[code].link;
    ogMetadata = data[code].ogMetadata;

    await client.close();
  } catch (error) {
    console.log("MongoDB Error", error);
  } finally {
    // console.log(link, ogMetadata);
    const html = generateHTMLWithOGMetadata(link, ogMetadata);

    // Set the content type to "text/html"
    res.set("Content-Type", "text/html");

    // Send the HTML response with the Open Graph metadata
    res.send(html);
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
