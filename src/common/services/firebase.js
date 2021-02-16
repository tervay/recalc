import "firebase/auth";
import "firebase/firestore";

import config from "common/services/gkey";
import firebase from "firebase/app";

firebase.initializeApp(config);

export default firebase;
