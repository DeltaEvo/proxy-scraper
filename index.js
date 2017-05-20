import scrapers from './src/scrapers'
import Lock from './src/util/promise-lock'
import child from 'child_process'
import path from 'path'
import { Readable as ReadableStream } from 'stream'
import debug from 'debug'
import os from 'os'

const log = debug('proxy-scraper')

export default class ProxyScraper {
	constructor({ workerCount = os.cpus().length }) {
		this._workers = []
		for (let i = 0; i < workerCount; i++) {
			log('Spawning worker %d', i)
			const worker = child.fork(path.join(__dirname, './src/worker.js'), [i])
			worker.on('error', error => console.error(error))
			this._workers.push(new Lock(worker))
		}
	}

	getProxies(timeout) {
		return this.scrapProxies().then(proxies =>
			this.testProxies(timeout, proxies)
		)
	}

	testProxies(timeout, proxies) {
		const stream = new ReadableStream({ objectMode: true })
		const proxiesCount = proxies.length
		const queue = proxies.slice(0) //Clone it
		stream._read = () => {
			for (const worker of this._workers) {
				let done = false
				const run = () => {
					if (queue.length) {
						const proxy = queue.pop()
						worker
							.get(worker => {
								const p = this._testProxy(
									{
										url: 'http://example.com/',
										proxy: proxy.port == 443
											? `https://${proxy.ip}`
											: `http://${proxy.ip}:${proxy.port}`,
										timeout
									},
									worker
								)
								return p
							})
							.then(time => {
								done = true
								proxy.time = time
								log('Working proxy: %o', proxy)
								stream.push(proxy)
							})
							.catch(e => null)
							.then(() => {
								stream.emit('progress', {
									length: proxiesCount,
									remaining: queue.length,
									percentage: (1 - queue.length / proxiesCount) * 100
								})
								return done ? null : run()
							})
					} else {
						stream.push(null)
					}
				}
				run()
			}
		}
		return stream
	}

	_testProxy(proxy, worker) {
		worker.send(proxy)
		return new Promise((resolve, reject) => {
			worker.once('message', data => {
				if (data.working) {
					resolve(data.time)
				} else {
					reject(data.error)
				}
			})
		})
	}

	scrapProxies() {
		const proxies = []
		log('Scrapers: %o', Object.keys(ProxyScraper.scrapers))
		for (let scraper in ProxyScraper.scrapers) {
			proxies.push(
				scrapers
					[scraper]()
					.then((proxies = []) => {
						log('Found %d proxies from %s', proxies.length, scraper)
						proxies.forEach(proxy => (proxy.source = scraper))
						return proxies
					})
					.catch(e => {
						log('Error while scraping proxies with %s\n%o', scraper, e)
						return []
					})
			)
		}
		return Promise.all(proxies).then(
			values => values.reduce((prev, next) => prev.concat(next)),
			[]
		)
	}
}

ProxyScraper.scrapers = scrapers
