const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    entry: {
      main: './game-core/index.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      clean: true,
      publicPath: './'
    },

    mode: argv.mode || 'development',

    devtool: isProduction ? 'source-map' : 'eval-source-map',

    resolve: {
      extensions: ['.js'],
      alias: {
        '@': path.resolve(__dirname, 'game-core'),
        '@components': path.resolve(__dirname, 'game-core/components'),
        '@systems': path.resolve(__dirname, 'game-core/systems'),
        '@utils': path.resolve(__dirname, 'game-core/utils'),
        '@managers': path.resolve(__dirname, 'game-core/managers')
      }
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions']
                  },
                  modules: false
                }]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext]'
          }
        },
        {
          test: /\.(mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/audio/[name].[hash][ext]'
          }
        }
      ]
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'game-core/index.html'),
        title: 'RainStorm ARPG',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),

      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])
    ],

    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          ecs: {
            test: /[\\/]game-core[\\/]ecs[\\/]/,
            name: 'ecs-core',
            chunks: 'all',
            priority: 10
          },
          systems: {
            test: /[\\/]game-core[\\/]systems[\\/]/,
            name: 'systems',
            chunks: 'all',
            priority: 5
          }
        }
      },
      
      runtimeChunk: 'single',
      
      usedExports: true,
      sideEffects: false
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true,
      historyApiFallback: true
    },

    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 250000,
      maxAssetSize: 250000
    },

    stats: {
      assets: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};