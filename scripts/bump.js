import { exec } from "child_process";
import { writeFileSync } from "fs";
import prompts from "prompts";
import { argv } from "yargs";

const choices = ["major", "minor", "patch"];

const questions = [
  {
    type: "select",
    name: "type",
    message: "What type of change is it?",
    choices: choices,
  },
];

(async () => {
  if (argv.v) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("./package.json");
    const version = pkg.version;
    writeFileSync("src/version.js", `export default "${version}";\n`);
  } else {
    const results = await prompts(questions);
    const type = choices[results.type];

    exec(`npm version ${type}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }
})();
