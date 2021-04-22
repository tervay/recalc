import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";

imagemin(["public/media/*"], {
  destination: "public/media",
  plugins: [imageminWebp({ quality: 100 })],
}).then(() => {});
