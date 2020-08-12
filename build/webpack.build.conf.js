const base = require("./webpack.base");
const merge = require("webpack-merge");
const { root } = require("./utils");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const argv = process.argv;
const showBundle = argv.includes("--report");

module.exports = merge(base, {
  mode: "production",
  entry: root("src/package/main.ts"),
  output: {
    path: root("lib"),
    filename: "scroll.js",
    publicPath: "/",
    library: "Scroll",
    libraryTarget: "umd",
    libraryExport: "default", // 需要暴露的模块
    umdNamedDefine: true,
  },
  performance: false,
  optimization: {
    minimize: true,
  },
  plugins: [],
});

showBundle && module.exports.plugins.push(new BundleAnalyzerPlugin());
