const prompts = require("prompts");
const { argv } = require("yargs");
const fs = require("fs");
const { exec } = require("child_process");

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
    const pkg = require("./package.json");
    const version = pkg.version;
    fs.writeFileSync("src/version.js", `export default "${version}";\n`);
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
