import ProxyAgent from 'proxy-agent'
import fetch from 'node-fetch'
import debug from 'debug'
const log = debug(`proxy-scraper:worker:${process.argv[2]}`)

log('Worker started !')
process.on('message', ({ url, method, proxy, timeout }) => {
	log('testing %s with proxy %s with %s ms of timeout', url, proxy, timeout)
	const startTime = Date.now()
	fetch(url, {
		method: method || 'GET',
		agent: new ProxyAgent(proxy),
		timeout
	})
		.then(() => process.send({ working: true, time: Date.now() - startTime }))
		.catch(error => process.send({ error, working: false }))
})
