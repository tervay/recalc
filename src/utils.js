export function isLocalhost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function PrepInputState(value, allowsZero_, extra = () => true) {
  let val = NaN;
  switch (value) {
    case ".":
      val = 0;
      break;
    case "-":
      val = 0;
      break;
    default:
      val = Number(value);
      break;
  }

  const isNonzero = val !== 0;
  const allowsZero = allowsZero_ !== undefined && allowsZero_ === true;

  return {
    valid: val !== NaN && (isNonzero || allowsZero) && extra(),
    value: val,
  };
}
