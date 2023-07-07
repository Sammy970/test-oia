const express = require("express");
const app = express();
const port = 3000;

app.set("trust proxy", true);

app.get("/insta", (req, res) => {
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(ipAddress);

  const instagramLink = req.query.link;

  // Check if the link is for a user profile
  const userRegex =
    /^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_\.]+)\/?$/;
  if (userRegex.test(instagramLink)) {
    const username = instagramLink.match(userRegex)[1];
    const deepLink = `instagram://user?username=${username}`;

    // Redirect to the user profile deep link
    res.redirect(deepLink);
    return;
  }

  // Check if the link is for a post
  const postRegex =
    /^https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_\-]+)\/?$/;
  if (postRegex.test(instagramLink)) {
    const postId = instagramLink.match(postRegex)[1];
    const deepLink = `instagram://p/${postId}`;

    // Redirect to the post deep link
    res.redirect(deepLink);
    return;
  }

  // Check if the link is for a story
  const storyRegex =
    /^https?:\/\/(?:www\.)?instagram\.com\/stories\/(?:[a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)\/?$/;
  if (storyRegex.test(instagramLink)) {
    const username = instagramLink.match(storyRegex)[1];
    const storyId = instagramLink.match(storyRegex)[2];
    const deepLink = `instagram://stories/${username}/${storyId}`;

    // Redirect to the story deep link
    res.redirect(deepLink);
    return;
  }

  // Fallback: Redirect to the web URL
  res.redirect(instagramLink);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
