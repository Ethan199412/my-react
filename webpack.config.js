const path = require("path");
const webpack = require("webpack");

const getConfig = (env) => {
  const entry = env.isExperiment
    ? "./experiment/mini-diff.ts"
    : "./src/index.tsx";

  return {
    entry,
    mode: "development",
    devtool: "cheap-module-eval-source-map",
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: "babel-loader",
          options: {
            presets: ["@babel/react", "@babel/preset-env"],
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.less$/,
          use: ["style-loader", "css-loader", "less-loader"],
        },
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.tsx?$/,
          use: [
            // { loader: 'thread-loader', options: { workers: 3 } },
            {
              loader: "babel-loader",
              options: {
                // 启用缓存机制，在重复打包未改变过的模块时防止二次编译，同时加快打包速度
                cacheDirectory: true,
                presets: ["@babel/react", "@babel/preset-env"],
              },
            },
            {
              loader: "ts-loader",
              // 不仅提升了性能，也解决了 ts-loader 和 thread-loader 兼容性问题
              options: {
                happyPackMode: true,
              },
            },
          ],
          exclude: /(node_modules|bower_components|dist)/,
        },
      ],
    },
    resolve: { extensions: ["*", ".js", ".jsx"] },
    output: {
      path: path.resolve(__dirname, "dist/"),
      publicPath: "/dist/",
      filename: "bundle.js",
    },
    devServer: {
      contentBase: path.join(__dirname, "public/"),
      port: 3000,
      publicPath: "http://localhost:3000/dist/",
      // hotOnly: true
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
  };
};

module.exports = getConfig;
