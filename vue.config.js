const path = require('path')
const CompressionPlugin = require('compression-webpack-plugin')
const resolve = dir => {
    return path.join(__dirname, dir)
}
module.exports = {
    publicPath: '/',
    outputDir: 'dist',
    assetsDir: 'static',
    lintOnSave: process.env.NODE_ENV === 'development',
    chainWebpack: config => {
        config.resolve.alias
            .set('@', resolve('src')) // key,value自行定义，比如.set('@@', resolve('src/components'))
            .set('_c', resolve('src/components'))
    },
    configureWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            config.plugins.push(
                new CompressionPlugin({
                    test: /\.js$|\.html$|\.css|\.png|\.jpg/, // 匹配文件名
                    threshold: 10240, // 对超过10k的数据压缩
                    deleteOriginalAssets: true // 不删除源文件
                }),
            )
        }
    },
    // 设为false打包时不生成.map文件
    productionSourceMap: false,
    devServer: {
        port: 8081,
        inline: true,
        hot: true,
        overlay: {
            warnings: false
        },

    },
    // 是否为 Babel 或 TypeScript 使用 thread-loader
    parallel: require('os').cpus().length > 1,
}
