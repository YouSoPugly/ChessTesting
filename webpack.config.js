const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./dist/main.js",
  devtool: 'inline-source-map',
  stats: {
    children: true,
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      jquery: "jquery/src/jquery",
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./dist/index.html",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
    ],
  },
};
