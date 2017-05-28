import ProxyScraper from '../index.js'
import { Transform as TransformStream } from 'stream'
import { createWriteStream } from 'fs'

const scraper = new ProxyScraper({ workerCount: 10 })

scraper.getProxies(500).then(stream => {
	const toJson = new TransformStream({ objectMode: true })
	toJson._transform = function(chunk, enc, cb) {
		this.push(`Working ${JSON.stringify(chunk)}\n`)
		cb()
	}

	stream.on('progress', progress => {
		console.log(
			`Progress ${progress.percentage.toFixed(2)}% (${progress.tested}/${progress.length}) (Source: ${progress.source})`
		)
	})

	stream.on('end', () => {
		console.log('Stopping workers')
		scraper.stop()
	})

	const jsonStream = stream.pipe(toJson)
	const logStream = createWriteStream('./proxy.log')
	jsonStream.pipe(process.stdout)
	jsonStream.pipe(logStream)
})
