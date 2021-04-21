const math = require("../math");

module.exports = () => ({
  calculateState: (args) => {
    return new Promise((resolve, reject) => {
      resolve(math.calculateState(args));
    });
  },
});
