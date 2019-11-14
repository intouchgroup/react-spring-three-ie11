'use strict';

const DEVELOPMENT_MODE = false;

const path = require('path');
const PluginCopy = require('copy-webpack-plugin');

const SOURCE_DIRECTORY = path.resolve(__dirname, 'src');
const OUTPUT_DIRECTORY = path.resolve(__dirname, 'dist');

const commonConfig = {
	mode: DEVELOPMENT_MODE ? 'development' : 'production',
	context: SOURCE_DIRECTORY,
	resolve: {
		extensions: [ '.js', '.jsx' ],
	},
	module: {
		rules: [
			{
				test: /\.html/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
				},
			},
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				include: [
					path.resolve(__dirname, 'node_modules', 'react-spring'),
					SOURCE_DIRECTORY,
				],
			},
		],
	},
	devtool: DEVELOPMENT_MODE ? 'cheap-module-source-map' : '', // Script source maps
	performance: {
		hints: DEVELOPMENT_MODE ? false : 'warning',
	},
	stats: 'normal',
};

const applicationConfig = {
	...commonConfig,
	entry: [
		'./index.jsx',
	],
	output: {
		path: OUTPUT_DIRECTORY,
		filename: 'bundle.js',
	},
	plugins: [
		new PluginCopy(
			[
				{
					from: path.resolve(SOURCE_DIRECTORY, 'index.html'),
					to: path.resolve(OUTPUT_DIRECTORY, 'index.html'),
				},
				{
					from: path.resolve(SOURCE_DIRECTORY, 'assets'),
					to: path.resolve(OUTPUT_DIRECTORY, 'assets'),
				},
			],
			{
				info: DEVELOPMENT_MODE,
			},
		),
	],
	devServer: {
		contentBase: OUTPUT_DIRECTORY,
		historyApiFallback: true,
	},
};

module.exports = [
	applicationConfig,
];
