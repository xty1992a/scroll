const { root } = require("./utils");
const baseConfig = {
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    path: root("lib"),
    filename: "[name]/index.js",
    publicPath: "./",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
        },
        exclude: /(node_modules)/,
      },
    ],
  },
};

module.exports = baseConfig;
