const express = require("express");
const path = require("path");
const sslRedirect = require("heroku-ssl-redirect");

const app = express();
app.use(sslRedirect());

app.use(express.static(path.join(__dirname, "../../build")));

app.get("*", function (req, res) {
  res.sendFile("index.html", { root: path.join(__dirname, "build/") });
});

app.listen(process.env.PORT || 5000);
