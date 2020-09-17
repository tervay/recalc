/**
 *
 * @param {(string|null)=} title
 */
export function setTitle(title) {
  document.title =
    title === null || title === undefined ? "ReCalc" : `ReCalc - ${title}`;
}
