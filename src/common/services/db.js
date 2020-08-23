import auth from "common/services/auth";
import key from "common/services/gkey";
import { getDate } from "common/tooling/util";
import { Database } from "firebase-firestore-lite";

const db = new Database({ projectId: key.projectId, auth });
console.dir(db);

export function save(user, name, url, query) {
  const userRef = db.ref(`users/${user}`);

  /* eslint-disable no-unused-vars */
  const res = userRef
    .get()
    .then((r) => {
      // Append new object to configs

      const newConfigs = r.configs;
      newConfigs.push({
        name,
        url,
        query,
        created: getDate(),
        modified: getDate(),
      });
      return userRef.update({
        configs: newConfigs,
      });
    })
    .then((r) => {
      console.log("updated state: ", r);
    });
}

export function getCalculators(user, cb) {
  const userRef = db.ref(`users/${user}`);
  userRef.get().then((r) => cb(r.configs));
}

export default db;
