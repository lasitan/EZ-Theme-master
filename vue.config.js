const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

const isProd = process.env.NODE_ENV === "production";

module.exports = defineConfig({
  publicPath: "./",
  outputDir: "dist",
  assetsDir: "static",
  lintOnSave: false,
  productionSourceMap: false,
  transpileDependencies: false,
  parallel: true,
  css: {
    sourceMap: false,
    loaderOptions: {
      sass: {
        implementation: require("sass"),
        sassOptions: {
          quietDeps: true,
          silenceDeprecations: ["legacy-js-api", "import"],
        },
        additionalData: `@use "@/assets/styles/base/variables.scss" as *;`,
      },
    },
  },
  configureWebpack: (config) => {
    config.resolve = { ...config.resolve, alias: { "@": path.resolve(__dirname, "src") } };
    config.plugins.push(
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
        "import.meta.env.TEST": "false",
      })
    );

    if (!isProd) {
      config.cache = { type: "filesystem" };
      config.devtool = "eval-cheap-module-source-map";
      config.watchOptions = { ignored: /node_modules/ };
    } else {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendors: { name: "chunk-vendors", test: /[\\/]node_modules[\\/]/, priority: -10, chunks: "initial" },
            common: { name: "chunk-common", minChunks: 2, priority: -20, chunks: "initial", reuseExistingChunk: true },
          },
        },
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: { compress: { drop_console: true, drop_debugger: true }, mangle: true, format: { comments: false, ascii_only: true } },
            extractComments: false,
          }),
        ],
      };
    }
  },
  chainWebpack: (config) => {
    if (!isProd) {
      config.plugins.delete("prefetch-index");
      config.plugins.delete("preload-index");
    }
  },
  pages: {
    index: { entry: "src/main.js", template: "public/index.html", filename: "index.html" },
  },
  devServer: {
    hot: true,
    client: { overlay: false },
    proxy: {
      "/api": {
        target: process.env.VUE_APP_API_PROXY_TARGET || "http://127.0.0.1:3000",
        changeOrigin: true,
        ws: false,
        timeout: 30000,
        proxyTimeout: 30000,
        onError(err, _req, res) {
          console.warn(`[proxy] 无法连接 ${process.env.VUE_APP_API_PROXY_TARGET || "http://127.0.0.1:3000"} (${err.code || err.message})`);
          if (res && !res.headersSent) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "后端未启动或代理失败，请确认 VUE_APP_API_PROXY_TARGET 对应服务已运行" }));
          }
        },
      },
    },
  },
});
