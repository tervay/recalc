import propTypes from "prop-types";

export default function HeadingWithBgImage(props) {
  return (
    <div className="columns">
      <div className="column is-3 title front-text">{props.title}</div>
      <div
        className="column is-9 bg-image"
        data-testid={"heading-bg-image-div"}
        style={{
          backgroundImage: `url("${props.image}.png")`,
          height: "100px",
        }}
      />
    </div>
  );
}

HeadingWithBgImage.propTypes = {
  title: propTypes.string,
  image: propTypes.string,
};
