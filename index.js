import scrapers from './src/scrapers'
import Lock from './src/util/promise-lock'
import child from 'child_process'
import fetch from 'node-fetch'
import path from 'path'
import { Readable as ReadableStream } from 'stream'
import debug from 'debug'
import os from 'os'

const log = debug('proxy-scraper')

const TYPES = ['http', 'socks']
const VALID_TYPES = ['socks', 'socks5', 'socks4', 'https', 'http']

export default class ProxyScraper {
	constructor({ workerCount = os.cpus().length } = {}) {
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
		log('Testing %d proxies with %d timeout', proxies.length, timeout)
		const stream = new ReadableStream({ objectMode: true })
		const proxiesCount = proxies.length
		const queue = proxies.slice(0) //Clone it
		let testedProxies = 0
		stream._read = () => {
			for (const worker of this._workers) {
				let done = false
				const run = () => {
					if (queue.length > 0) {
						const proxy = queue.pop()
						worker
							.get(worker =>
								this._testProxy(
									{
										url: 'http://example.com/',
										proxy: proxy.url(),
										timeout
									},
									worker
								)
							)
							.then(time => {
								done = true
								proxy.time = time
								log('Working proxy: %o', proxy)
								stream.push(proxy)
							})
							.catch(e => {
								if (e.type && e.type == 'missmatch')
									log('Content missmatch %o for proxy %o', e, proxy)
							})
							.then(() => {
								testedProxies++
								if(testedProxies === proxiesCount)
									stream.push(null)
								stream.emit('progress', {
									length: proxiesCount,
									tested: testedProxies,
									remaining: proxiesCount - testedProxies,
									percentage: (testedProxies / proxiesCount) * 100,
									source: proxy.source
								})
								if (!done) run()
							})
					}
				}
				run()
			}
		}
		return fetch('http://example.com/')
			.then(res => res.text())
			.then(page =>
				Promise.all(
					this._workers.map(worker =>
						worker.get(worker => this._setPage(page, worker))
					)
				)
			)
			.then(() => stream)
	}

	_testProxy(proxy, worker) {
		worker.send({
			event: 'test',
			data: proxy
		})
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

	_setPage(page, worker) {
		worker.send({
			event: 'page',
			data: page
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
						return proxies
							.map(proxy => this._aggregateProxy(proxy, scraper))
							.reduce((prev, next) => prev.concat(next), [])
					})
					.catch(e => {
						log('Error while scraping proxies with %s\n%o', scraper, e)
						return []
					})
			)
		}
		return Promise.all(proxies).then(values =>
			values.reduce((prev, next) => prev.concat(next))
		)
	}

	stop() {
		for (const worker of this._workers) {
			worker.get(worker => worker.kill())
		}
	}

	_aggregateProxy(proxy, source) {
		const aproxy = {
			source,
			url() {
				return `${this.type}://${this.ip}:${this.port}`
			},
			...proxy
		}

		return VALID_TYPES.includes(aproxy.type)
			? aproxy
			: TYPES.map(type => ({
					...aproxy,
					type
				}))
	}
}

ProxyScraper.scrapers = scrapers
