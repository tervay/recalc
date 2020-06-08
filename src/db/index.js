import Auth from "firebase-auth-lite";
import firebaseConfig from "db/key";
import Firestore from "firebase-firestore-lite";

export const auth = new Auth({
  apiKey: firebaseConfig.apiKey,
  redirectUri: window.location.origin + "/auth",
});

export const db = new Firestore({ projectId: firebaseConfig.projectId, auth });

export function save(user, name, url, query) {
  const userRef = db.reference(`users/${user}`);
  const res = userRef
    .get()
    .then((r) => {
      // User is found!
      return r;
    })
    .catch((e) => {
      // User not found. Creating
      userRef.set({
        id: user,
        configs: [],
      });
      return userRef;
    })
    .then((r) => {
      // Append new object to configs
      const newConfigs = r.configs;
      newConfigs.push({ name, url, query });
      return userRef.update({
        configs: newConfigs,
      });
    })
    .then((r) => {
      console.log("updated state: ", r);
    });
}
