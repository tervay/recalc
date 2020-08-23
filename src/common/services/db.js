import firebase from "common/services/firebase";

import { getDate } from "../tooling/util";

const db = firebase.firestore();

export function maybeInitializeUserData(user) {
  const ref = db.collection("users").doc(user);
  ref.get().then((doc) => {
    if (!doc.exists) {
      ref.set({
        id: user,
        configs: [],
      });
    }
  });
}

export function save(user, name, url, query) {
  const ref = db.collection("users").doc(user);

  ref.get().then((doc) => {
    if (doc.exists) {
      ref.update({
        configs: firebase.firestore.FieldValue.arrayUnion({
          name,
          url,
          query,
          created: getDate(),
          modified: getDate(),
        }),
      });
    }
  });
}

export function getCalculators(user, cb) {
  const ref = db.collection("users").doc(user);
  ref.get().then((doc) => {
    if (doc.exists) {
      cb(doc.data().configs);
    }
  });
}
