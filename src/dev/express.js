const express = require("express");
const path = require("path");
const sslRedirect = require("heroku-ssl-redirect");
const expressStaticGzip = require("express-static-gzip");

const app = express();
app.use(sslRedirect());

app.use(
  expressStaticGzip(path.join(__dirname, "../../build"), {
    enableBrotli: true,
    orderPreference: ["br", "gz"],
  })
);

app.get("*", function (req, res) {
  res.sendFile("index.html", { root: path.join(__dirname, "../../build/") });
});

app.listen(process.env.PORT || 5000);
