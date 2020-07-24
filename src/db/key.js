let key = {
  apiKey: "AIzaSyDuLDBeMeSvH6rMb8A43m_aAssCS-wWxbY",
  projectId: "recalc-1590210745953",
};

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  key = {
    apiKey: "AIzaSyDOPkHtByQXGnNRcOuazuxjF9yW-T_-OZs",
    projectId: "recalc-dev",
  };
}

export default key;
