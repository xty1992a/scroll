const { root } = require("./utils");

const dev = process.env.NODE_ENV === "development";
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
      {
        test: /\.less$/,
        use: [
          dev
            ? {
                loader: "style-loader",
              }
            : MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "less-loader",
          },
        ],
      },
    ],
  },
};

module.exports = baseConfig;
