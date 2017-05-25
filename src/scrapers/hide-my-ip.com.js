import fetch from 'node-fetch'

const ANONIMITY_LEVELS = ['Low', 'Med', 'High']

export default function scrap(types) {
	return fetch('https://www.hide-my-ip.com/proxylist.shtml', {
		headers: {
			'User-Agent': 'Mozilla/5.0'
		}
	})
		.then(res => res.text())
		.then(text =>
			/var json =..(\[(?:.*)\]);<!-- proxylist -->/.exec(
				text.split('\n').join(' ')
			)
		)
		.then(match => (match ? JSON.parse(match[1]) : []))
		.then(proxies =>
			proxies.map(proxy => ({
				ip: proxy.i,
				port: parseInt(proxy.p),
				country: proxy.c.n.toUpperCase(),
				type: proxy.tp.toLowerCase(),
				anonimity: ANONIMITY_LEVELS.indexOf(proxy.a)
			}))
		)
}
