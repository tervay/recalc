import { useState } from "react";

export function useStateOutput(calcCallback) {
  const [state, setState] = useState(calcCallback());
  return [
    state,
    (x) => {
      setState(x || calcCallback());
    },
  ];
}
