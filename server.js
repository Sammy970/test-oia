const express = require("express");
const app = express();
const port = 3000;

app.set("trust proxy", true);

app.get("/abcd", (req, res) => {
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(ipAddress);

  // Check if the request is coming from a mobile device
  const userAgent = req.headers["user-agent"];
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

  if (isMobile) {
    // Redirect to the deep link URL for the app
    res.redirect("https://www.instagram.com/p/CUJoVRGoMxT");
  } else {
    // Redirect to a web URL as a fallback for non-mobile devices
    res.redirect("https://www.instagram.com/my_art_craft");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
