// contents of webpack.config.js
const path = require("path");
const pkg = require("./package.json");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: `./src/${pkg.entry}.ts`,
  externals: {
    "@builder.io/react": "@builder.io/react",
    "@builder.io/app-context": "@builder.io/app-context",
    "@emotion/core": "@emotion/core",
    react: "react",
    "react-dom": "react-dom",
  },
  output: {
    filename: pkg.output,
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "system",
  },
  devtool: "inline-source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    fallback: {
      fs: false,
      tls: false,
      net: false,
      path: false,
      zlib: false,
      http: false,
      https: false,
      stream: false,
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-typescript"],
            },
          },
        ],
      },
    ],
  },
  devServer: {
    port: 1268,
    static: {
      directory: path.join(__dirname, "./dist"),
    },
    headers: {
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public", to: "public" }],
    }),
  ],
};
