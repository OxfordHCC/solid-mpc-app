const path = require("path");
module.exports = {
   mode: "development",
   devtool: "inline-source-map",
   entry: [ "./src/index.js", "./src/mpc.js" ],
   output: {
     path: path.resolve(__dirname, "dist"), 
     filename: "index.js" 
   },
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.resolve(__dirname, "src"),
        use: [ { loader: "style-loader" }, { loader: "css-loader" } ],
      },
      {
        test: /\.(mpc|py|txt)$/,
        include: path.resolve(__dirname, "src"),
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext]",
        },
      },
    ]
  },
  devServer: {
    static: "./dist",
    port: 8800,
  }
};
