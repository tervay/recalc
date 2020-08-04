const imagemin = require("imagemin");
const imageminWebp = require("imagemin-webp");

imagemin(["public/media/*"], {
  destination: "public/media",
  plugins: [imageminWebp({ quality: 100 })],
}).then(() => {});
