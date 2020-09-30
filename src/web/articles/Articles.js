import md from "markdown-it";
import mk from "markdown-it-katex";
import propTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Error404 from "web/404";
import wretch from "wretch";

export default function Articles() {
  const renderer = md();
  renderer.use(mk);

  const [content, setContent] = useState("");
  const [err, setErr] = useState(false);

  const { id } = useParams();

  useEffect(() => {
    wretch(`/raw_articles/${id}.md`)
      .get()
      .text((md) => {
        if (md.startsWith("<!DOCTYPE") || md.startsWith("<!doctype")) {
          setErr(true);
        }

        let rendered = renderer.render(md);

        // Ok this is bad I'm sorry
        // [...Array(6).keys()].forEach((n) => {
        //   const tag = `<h${n}>`;
        //   const replaced = `<h${n} class="title is-${n}">`;
        //   rendered = rendered.replaceAll(tag, replaced);
        // });

        setContent(rendered);
      });
  }, []);

  if (err) {
    return <Error404 />;
  }

  return (
    <div
      className={"md-article"}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

Articles.propTypes = {
  id: propTypes.string,
};
