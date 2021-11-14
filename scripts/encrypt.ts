import AES from "crypto-js/aes";
import fs from "fs";
import readline from "readline";
import creds from "../cred.json";

const credString = JSON.stringify(creds);

readline
  .createInterface({ input: process.stdin, output: process.stdout })
  .question("Enter encryption password: ", (pw) => {
    const encrypted = AES.encrypt(credString, pw);
    console.log(`Encrypting ${credString}\n`);
    console.log(`Using encryption key [${pw}]\n`);
    console.log(`Encrypted phrase: ${encrypted.toString()}\n`);
    fs.writeFile(
      "src/creds.enc.json",
      JSON.stringify({ value: encrypted.toString() }, undefined, 2),
      (err) => {
        if (err) {
          console.log(err);
        }
        process.exit(0);
      }
    );
  });
