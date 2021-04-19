import { parseHeaders, render } from "common/tooling/md";
import propTypes from "prop-types";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Error404 from "web/404";
import wretch from "wretch";

export default function Articles() {
  const [content, setContent] = useState("");
  const [err, setErr] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [updated, setUpdated] = useState("");

  const { id } = useParams();

  useEffect(() => {
    wretch(`/raw_articles/${id}.md`)
      .get()
      .text((md) => {
        if (md.startsWith("<!DOCTYPE") || md.startsWith("<!doctype")) {
          setErr(true);
        }

        let headers = parseHeaders(md);
        setTitle(headers.title);
        setAuthor(headers.author);
        setUpdated(headers.updated);

        let rendered = render(md);
        setContent(rendered);
      });
  }, []);

  if (err) {
    return <Error404 />;
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">{title}</h1>
            <h2 className="subtitle">by {author}</h2>
            <h2 className="subtitle" style={{ marginTop: "-1.25rem" }}>
              Last updated {updated}
            </h2>
          </div>
        </div>
      </section>
      <div
        className={"content"}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}

Articles.propTypes = {
  id: propTypes.string,
};
