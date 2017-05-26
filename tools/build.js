import data from 'babel-preset-env/data/plugins.json'
import { rollup } from 'rollup'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-local-resolve'
import pkg from '../package.json'
import fs from 'fs-extra'
import { join, dirname } from 'path'
import { transformFile } from 'babel-core'

const VERSIONS = Object.values(data)
	.map(p => p.node)
	.filter((e, i, array) => e && array.indexOf(e) == i)
	.sort()
	.reverse()

const NODE_MODULES = [
	'vm',
	'fs',
	'os',
	'path',
	'child_process',
	'url',
	'stream'
]

const FOLDER = 'lib'

const WORKER = 'src/worker.js'

function generateLoader(versions) {
	const checks = VERSIONS.map(
		ver => `if(v>=${ver})module.exports=require('${versions.get(ver)}')\n`
	).reduce((prev, next) => (prev ? `${prev}else ${next}` : next))
	return `var v=parseFloat(process.versions.node)\n${checks}`
}

function build() {
	const versions = new Map()
	let chain = Promise.resolve()
	for (const ver of VERSIONS) {
		versions.set(ver, `./${ver}.js`)
		chain = chain.then(() => console.log(`Building for node ${ver}`)).then(() =>
			rollup({
				entry: './index.js',
				external: Object.keys(pkg.dependencies).concat(NODE_MODULES),
				plugins: [
					resolve(),
					babel({
						babelrc: false,
						exclude: 'node_modules/**',
						presets: [
							[
								'env',
								{
									targets: {
										node: ver
									},
									modules: false
								}
							]
						],
						plugins: [
							'external-helpers',
							['transform-object-rest-spread', { useBuiltIns: true }]
						]
					})
				]
			}).then(bundle =>
				bundle.write({
					dest: join(FOLDER, `${ver}.js`),
					format: 'cjs',
					sourceMap: true
				})
			)
		)
	}
	return chain.then(() => versions)
}

function copyWorker() {
	return new Promise((resolve, reject) =>
		transformFile(
			WORKER,
			{
				babelrc: false,
				ast: false,
				sourceMaps: true,
				presets: [
					[
						'env',
						{
							targets: {
								node: 0.12
							}
						}
					]
				],
				plugins: [['transform-object-rest-spread', { useBuiltIns: true }]]
			},
			(err, result) => (err ? reject(err) : resolve(result))
		)
	).then(({ code, map }) =>
		Promise.all([
			fs.outputFile(join(FOLDER, WORKER), code),
			fs.outputJson(join(FOLDER, WORKER + '.map'), map)
		])
	)
}
fs
	.remove(FOLDER)
	.then(build)
	.then(generateLoader)
	.then(
		loader =>
			new Promise((resolve, reject) =>
				fs.writeFile(
					join(FOLDER, 'index.js'),
					loader,
					err => (err ? reject(err) : resolve())
				)
			)
	)
	.then(copyWorker)
	.catch(e => console.error(e))
