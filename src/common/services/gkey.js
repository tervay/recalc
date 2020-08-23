let config = {
  apiKey: "AIzaSyDuLDBeMeSvH6rMb8A43m_aAssCS-wWxbY",
  authDomain: "recalc-1590210745953.firebaseapp.com",
  databaseURL: "https://recalc-1590210745953.firebaseio.com",
  projectId: "recalc-1590210745953",
  storageBucket: "recalc-1590210745953.appspot.com",
  messagingSenderId: "411934684683",
  appId: "1:411934684683:web:7fea40e5db5843a78cf90e",
  measurementId: "G-RSHEVCMNTB",
};

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  config = {
    apiKey: "AIzaSyDOPkHtByQXGnNRcOuazuxjF9yW-T_-OZs",
    authDomain: "recalc-dev.firebaseapp.com",
    databaseURL: "https://recalc-dev.firebaseio.com",
    projectId: "recalc-dev",
    storageBucket: "recalc-dev.appspot.com",
    messagingSenderId: "91281136254",
    appId: "1:91281136254:web:fc9c9710f891aa8540d62f",
  };
}

export default config;
