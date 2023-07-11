// Importing Dependencies
const express = require("express");
const { nanoid } = require("nanoid");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const useragent = require("express-useragent");
const geoip = require("geoip-lite");

// Important Settings
const app = express();
const port = 3003;

// App Sets
app.set("trust proxy", true);
app.use(cors());
app.use(useragent.express());

// Object to store generated codes and their corresponding links
const codes = {};

app.get("/", async (req, res) => {
  res.send("Good");
});

app.get("/generate", async (req, res) => {
  const link = req.query.link;
  const email = req.query.email;
  const getCodes = req.query.codes;

  if (getCodes === "yes") {
    res.send(codes);
  } else {
    let ogMetadata = await fetchOGMetadata(link);
    const code = nanoid(4);

    if (ogMetadata === null) {
      const apiURL = `https://py-meta.vercel.app?url=${link}`;
      const response = await fetch(apiURL);
      const resData = await response.json();

      if (Object.keys(resData).length === 0) {
        ogMetadata = null;
      } else {
        const modifiedOgMetadata = {};

        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            modifiedOgMetadata["og:" + key] = resData[key];
          }
        }
        ogMetadata = modifiedOgMetadata;
      }
    }

    const shortenedLink = `${req.protocol}://${req.get("host")}/${code}`;

    const newData = {
      _id: nanoid(24),
      [code]: {
        link: link,
        ogMetadata,
      },
    };

    const newData2 = {
      [code]: {
        link: link,
        ogMetadata,
      },
    };

    const newData3 = {
      _id: nanoid(24),
      [email]: [newData2],
    };

    try {
      const apiURL = "https://oia-second-backend.vercel.app/api/storeLinks";
      const bodyContent = {
        data: newData,
        email: email,
        data2: newData2,
        newUsersData: newData3,
      };

      const options = {
        method: "POST",
        body: JSON.stringify(bodyContent),
        headers: { "Content-Type": "application/json" },
      };

      const response = await fetch(apiURL, options);

      if (response.status === 201) {
        const dataResponse = await response.json();
        const status = dataResponse.status;
        res.statusCode = 201;
        return res.send({ shortenedLink, status });
      } else {
        return res.json({
          error: "Error in storing the link data",
        });
      }
    } catch (error) {
      console.log("Error in storeLinks API CALL", error);
    }
  }
});

app.get("/:code", async (req, res) => {
  const code = req.params.code;

  // Track link click
  trackLinkClick(code, req.useragent, req.ip);

  try {
    const apiURL = "https://oia-second-backend.vercel.app/api/fetchLinks";
    const bodyContent = {
      data: code,
    };

    const options = {
      method: "POST",
      body: JSON.stringify(bodyContent),
      headers: { "Content-Type": "application/json" },
    };

    const response = await fetch(apiURL, options);

    if (response.status === 201) {
      const dataResponse = await response.json();

      ogLink = dataResponse[code].link;
      ogMetadata = dataResponse[code].ogMetadata;

      const html = await generateHTMLWithOGMetadata(ogLink, ogMetadata);

      // Set the content type to "text/html"
      res.set("Content-Type", "text/html");

      // Send the HTML response with the Open Graph metadata
      return res.send(html);
    } else {
      return res.status(404).send("Code not found");
    }
  } catch (error) {
    console.log("Error in fetchLinks API CALL", error);
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

    return ogMetadata;
  } catch (error) {
    console.error("Error fetching Open Graph metadata:");
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
      metaTags += `<meta property="${property}" content='${content}' />`;
    }
  }

  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        ${metaTags}
      </head>
      <body>
        <h1>OpenInApp Clone</h1>
        <p>Redirecting...</p>
        <script>
          window.location.href = "${link}";
        </script>
      </body>
    </html>
  `;

  return html;
}

function trackLinkClick(code, useragent, ipAddress) {
  const { browser, os } = useragent;

  const device = {
    browser: browser.name,
    version: browser.version,
    os: os.name,
    platform: os.platform,
  };

  const geo = geoip.lookup(ipAddress);

  const location = {
    city: geo ? geo.city : "Unknown",
    state: geo ? geo.region : "Unknown",
  };

  // Log the device and location information
  console.log("Device:", device);
  console.log("Location:", location);
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
