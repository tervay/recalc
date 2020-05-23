import * as firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";

export function initFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyDrado2TrHbLVuiaEC2kQWX09NfwAqFABU",
    authDomain: "recalc-1590210745953.firebaseapp.com",
    databaseURL: "https://recalc-1590210745953.firebaseio.com",
    projectId: "recalc-1590210745953",
    storageBucket: "recalc-1590210745953.appspot.com",
    messagingSenderId: "411934684683",
    appId: "1:411934684683:web:7fea40e5db5843a78cf90e",
    measurementId: "G-RSHEVCMNTB",
  };
  firebase.initializeApp(firebaseConfig);
}

initFirebase();
const db = firebase.firestore();
export const firebaseAuth = firebase.auth;
// firebase.auth().signInWithPopup(googleProvider).then((r) => {
//     console.log(r);
// })
export default db;
