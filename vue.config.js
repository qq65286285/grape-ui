const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8309
  },
  configureWebpack: {
    resolve: {
      fallback: {
        stream: require.resolve('stream-browserify')
      }
    }
  },
  chainWebpack: config => {
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .include.add(/node_modules/)
      .end()
      .type('javascript/auto')
  }
})