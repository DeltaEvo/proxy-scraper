import fetch from 'node-fetch'

export default function createTextScraper(url) {
	return function scrap() {
		return fetch(url).then(res => res.text()).then(text => extractProxies(text))
	}
}

export function extractProxies(text, data = {}) {
	return text
		.split('\n')
		.map(proxy => proxy.split(':'))
		.map(([ip, port]) => Object.assign({ ip, port: parseInt(port) }, data))
}
