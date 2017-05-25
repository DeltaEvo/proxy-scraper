import ProxyAgent from 'proxy-agent'
import fetch from 'node-fetch'
import debug from 'debug'
import { parse } from 'url'
const log = debug(`proxy-scraper:worker:${process.argv[2]}`)

log('Worker started !')

let page

process.on('message', msg => {
	switch (msg.event) {
		case 'test':
			testProxy(msg.data)
			break
		case 'page':
			page = msg.data
			break
	}
})

function testProxy({ url, method, proxy, timeout }) {
	log('testing %s with proxy %s and %s ms of timeout', url, proxy, timeout)
	const startTime = Date.now()
	const p = parse(proxy)
	p.timeout = timeout
	fetch(url, {
		method: method || 'GET',
		agent: new ProxyAgent(p),
		timeout
	})
		.then(res => {
			if (page) {
				return res.text().then(p => {
					if (p != page) {
						const e = new Error('Page content missmatch')
						e.type = 'missmatch'
						throw e
					}
				})
			}
		})
		.then(() => process.send({ working: true, time: Date.now() - startTime }))
		.catch(error => process.send({ error, working: false }))
}
