import React from "react";

export default function Hero(props) {
  return (
    <section className="hero">
      <div className="hero-body">
        <div className="container">
          <h1 className="title">{props.title}</h1>
          <h2 className="subtitle">{props.subtitle || ""}</h2>
        </div>
      </div>
    </section>
  );
}
