import ProxyScraper from '..'
import { Transform as TransformStream } from 'stream'
import { createWriteStream } from 'fs'

const scraper = new ProxyScraper()

scraper.getProxies(1000).then(stream => {
	const toJson = new TransformStream({ objectMode: true })
	toJson._transform = function(chunk, enc, cb) {
		this.push(JSON.stringify(chunk) + '\n')
		cb()
	}

	stream.on('progress', progress => {
		console.log('Progress ' + progress.percentage.toFixed(2))
	})

	const jsonStream = stream.pipe(toJson)
	const logStream = createWriteStream('./proxy.log')
	jsonStream.pipe(process.stdout)
	jsonStream.pipe(logStream)
})
