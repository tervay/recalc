import ShareButton from "common/components/calc-heading/ShareButton";
import React from "react";

export default function Heading(props) {
  return (
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">{props.title}</h1>
          {props.subtitle && <h2 class="subtitle">{props.subtitle}</h2>}
          <ShareButton getQuery={props.getQuery} />
        </div>
      </div>
    </section>
  );
}
