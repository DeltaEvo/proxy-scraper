import fetch from 'node-fetch'

export default function createTextScraper(url, aggregator) {
	return function scrap() {
		return fetch(url)
			.then(res => res.text())
			.then(text => extractProxies(text, aggregator))
	}
}

export function extractProxies(text, aggregator = function() {}) {
	return text
		.split('\n')
		.map(proxy => {
			const more = proxy.split(' ')
			const [ip, p] = more[0].split(':')
			const port = parseInt(p)
			if (validIp(ip) && validPort(port)) {
				const agg = aggregator(more.slice(1))
				return {
					ip,
					port,
					...agg
				}
			}
		})
		.filter(proxy => proxy !== undefined)
}

export function validIp(ip) {
	return true
}

export function validPort(port) {
	return port > 0 && port <= 65535
}
