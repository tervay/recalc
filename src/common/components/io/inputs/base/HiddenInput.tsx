export default function HiddenInput(): JSX.Element {
  return (
    <div className="field is-horizontal" style={{ visibility: "hidden" }}>
      <div className="field-label is-normal">
        <label className="label"></label>
      </div>
      <div className="field-body">
        <div className="field has-addons">
          <p className="control">
            <input className="input" />
          </p>
        </div>
      </div>
    </div>
  );
}
