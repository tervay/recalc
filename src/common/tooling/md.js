import md from "markdown-it";
import mdAnchor from "markdown-it-anchor";
import mk from "markdown-it-katex";
import mdToc from "markdown-it-toc-done-right";
import ago from "s-ago";

export function render(markdown) {
  const renderer = md();
  renderer.use(mk);
  renderer.use(mdAnchor, {
    permalink: true,
    permalinkBefore: true,
    permalinkSymbol: "§",
  });
  renderer.use(mdToc);
  return renderer.render(markdown);
}

export function parseHeaders(markdown) {
  let headers = {};
  const split = markdown.split("\n");
  split.forEach((line) => {
    if (line.startsWith("[//]:")) {
      const tag = line.match(/<(.*)>/)[1];
      headers[tag] = line.match(/\((.*)\)/)[1];
    }
  });

  headers.updated = ago(new Date(headers.updated), "day");
  return headers;
}
