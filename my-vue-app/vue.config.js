const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
});

module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule('js')
      .use('babel-loader')
      .tap((options) => {
        options.plugins = options.plugins || [];
        options.plugins.push('@babel/plugin-transform-private-methods');
        return options;
      });
  },
}