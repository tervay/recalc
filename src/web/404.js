import sample from "lodash/sample";

export default function Error404() {
  const gifs = [
    "https://thumbs.gfycat.com/PotableClearcutHeterodontosaurus-mobile.mp4",
    "https://i.imgur.com/cv27BaL.mp4",
    "https://i.imgur.com/PxzCKCO.mp4",
    "https://i.imgur.com/iLQ5k4i.mp4",
    "https://i.imgur.com/led15Z7.gif",
    "https://i.imgur.com/bktltGc.gif",
    "https://i.redd.it/zxtkqru6yy811.gif",
  ];

  const gif = sample(gifs);
  let embed = <></>;
  if (gif.endsWith(".mp4")) {
    embed = (
      <video width="500" autoPlay={"autoplay"} muted loop={"true"}>
        <source src={gif} type="video/mp4" />
      </video>
    );
  } else if (gif.endsWith(".gif")) {
    embed = <img src={gif} alt={"Robot falling"} />;
  }

  return (
    <>
      <div content={"block"}>{embed}</div>
      <div content={"block"}>You&apos;ve taken a wrong turn :(</div>
    </>
  );
}
