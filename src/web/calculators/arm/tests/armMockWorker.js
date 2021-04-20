const math = require("../math");
console.log(math);

module.exports = () => ({
  calculateState: (args) => {
    return new Promise((resolve, reject) => {
      resolve(math.calculateState(args));
    });
  },
});
