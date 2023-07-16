// Importing Dependencies
const express = require("express");
const { nanoid } = require("nanoid");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Important Settings
const app = express();
const port = 3003;

// App Sets
app.set("trust proxy", true);
app.use(cors());

// Object to store generated codes and their corresponding links
const codes = {};

app.get("/", async (req, res) => {
  res.send("Good");
});

app.get("/generate", async (req, res) => {
  const link = req.query.link;
  const email = req.query.email;
  // console.log(email);
  const getCodes = req.query.codes;

  if (getCodes === "yes") {
    res.send(codes);
  } else {
    let ogMetadata = await fetchOGMetadata(link);
    const code = nanoid(4);

    const valueCheck = Object.keys(ogMetadata).length === 0;

    if (valueCheck) {
      const apiURL = `https://py-meta.vercel.app?url=${link}`;
      try {
        const response = await fetch(apiURL);
        const resData = await response.json();
        if (Object.keys(resData).length === 0) {
          ogMetadata = {};
        } else {
          const modifiedOgMetadata = {};

          for (const key in resData) {
            if (resData.hasOwnProperty(key)) {
              modifiedOgMetadata["og:" + key] = resData[key];
            }
          }
          ogMetadata = modifiedOgMetadata;
        }
      } catch (error) {
        console.log("Error at PY Meta Backend ", error);
      } finally {
        if (Object.keys(ogMetadata).length === 0) {
          // console.log("I am in if");
          try {
            const apiKey = process.env.OPENGRAPHIO_APPID;
            const apiURL = `https://opengraph.io/api/1.1/site/${encodeURIComponent(
              link
            )}?app_id=${apiKey}`;

            const response = await fetch(apiURL);
            const data = await response.json();

            if (Object.keys(data).toString() === "error") {
              console.log(data);
              console.log("We got some error");
              ogMetadata = {};
            } else {
              // console.log("I am in this");
              const ogData = {
                "og:title": data.htmlInferred.title,
                "og:description": data.htmlInferred.description,
                "og:type": data.htmlInferred.type,
                "og:image": data.htmlInferred.imageSecureUrl,
                "og:url": data.htmlInferred.url,
                "og:favicon": data.htmlInferred.favicon,
                "og:site_name": data.htmlInferred.site_name,
              };

              ogMetadata = ogData;
            }
          } catch (error) {
            console.log("Error at OpenGraph.io API Call: ", error);
          }
        } else {
          console.log("I am in else");
        }
      }
    }

    // console.log(ogMetadata);

    const shortenedLink = `${req.protocol}://${req.get("host")}/${code}`;

    const newData = {
      _id: nanoid(24), // Generate a new ObjectId for the document
      [code]: {
        link: link,
        ogMetadata,
        clicks: 0,
      },
    };

    // const newData2 = {
    //   code: code,
    //   link: link,
    //   ogMetadata,
    // };

    const newData2 = {
      [code]: {
        link: link,
        ogMetadata,
        clicks: 0,
      },
    };

    const newData3 = {
      _id: nanoid(24),
      [email]: [newData2],
    };

    try {
      const apiURL = "https://oia-second-backend.vercel.app/api/storeLinks";
      // const apiURL = "http://localhost:3001/api/storeLinks";
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

      // console.log(response.status);

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
  // const codeData = codes[code];

  let ipData;

  try {
    const ip = req.headers["x-forwarded-for"];
    console.log(ip);
    const resData = await fetch(`http://ip-api.com/json/${ip}`);
    ipData = await resData.json();
  } catch (error) {
    console.log("Error in getting data of IP Address", error);
  }

  console.log(ipData);

  try {
    const apiURL = "https://oia-second-backend.vercel.app/api/fetchLinks";
    // const apiURL = "http://localhost:3001/api/fetchLinks ";
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

    // console.log(body);
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

    console.log(ogMetadata);

    // console.log(ogMetadata);

    return ogMetadata;
  } catch (error) {
    console.error("Error fetching Open Graph metadata:");
    return {};
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
