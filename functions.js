const axios = require("axios");
const cheerio = require("cheerio");

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

module.exports = { fetchOGMetadata };
