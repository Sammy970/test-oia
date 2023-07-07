// utils.js

const metascraper = require("metascraper")([
  require("metascraper-author")(),
  require("metascraper-description")(),
  require("metascraper-image")(),
  require("metascraper-logo")(),
  require("metascraper-title")(),
  require("metascraper-url")(),
]);

const got = require("got");

async function fetchOGMetadata(url) {
  try {
    const { body: html, url: finalUrl } = await got(url);
    const metadata = await metascraper({ html, url: finalUrl });

    console.log(metadata);

    return metadata;
  } catch (error) {
    console.error("Error fetching Open Graph metadata:", error);
    return null;
  }
}

function addNumbers(a, b) {
  return a + b;
}

function multiplyNumbers(a, b) {
  return a * b;
}

module.exports = {
  fetchOGMetadata,
  addNumbers,
  multiplyNumbers,
};
