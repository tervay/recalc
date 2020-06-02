export const localhostClientId =
  "411934684683-agkmu38ndl2ovnsrocpcr2b1opmc7ap0.apps.googleusercontent.com";
export const prodClientId =
  "411934684683-034ssgvppgghiv9iipftsjo4bogtthtk.apps.googleusercontent.com";

function isLocalhost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function getClientId() {
  return isLocalhost() ? localhostClientId : prodClientId;
}
