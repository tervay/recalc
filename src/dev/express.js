const express = require("express");
const path = require("path");
const expressStaticGzip = require("express-static-gzip");

const sslRedirect = (env, status) => {
  env = env || ["production"];
  status = status || 302;

  return (req, res, next) => {
    if (env.indexOf(process.env.NODE_ENV) >= 0) {
      if (req.headers["x-forwarded-proto"] !== "https") {
        res.redirect(status, "https://" + req.hostname + req.originalUrl);
      } else {
        next();
      }
    } else {
      next();
    }
  };
};

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
