import React from "react";

import SaveButton from "../account/saved/SaveButton";
export default function Hero(props) {
  return (
    <section className="hero">
      <div className="hero-body">
        <div className="container">
          <h1 className="title">{props.title}</h1>
          <h2 className="subtitle">{props.subtitle || ""}</h2>
          <SaveButton query={props.query} />
        </div>
      </div>
    </section>
  );
}
