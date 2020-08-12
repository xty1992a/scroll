const { join } = require("path");

module.exports = {
  root: (path) => join(__dirname, "..", path),
};
