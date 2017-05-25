import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'

const ANONIMITY_LEVELS = ['transparent', 'anonymous', 'elite proxy']

const SOURCES = [
	{
		url: 'http://www.free-proxy-list.net',
		type(element) {
			return element.eq(5).text() === 'yes' ? 'https' : 'http'
		},
		anonymity: 4
	},
	{
		url: 'http://www.socks-proxy.net',
		type(element) {
			return element.eq(4).text().toLowerCase()
		},
		anonymity: 5
	}
]

export default function scrap() {
	return Promise.all(
		SOURCES.map(source =>
			fetch(source.url).then(cheerio()).then($ =>
				$('#proxylisttable > tbody > tr')
					.map((i, e) => {
						const element = $(e).find('td')
						const ip = element.eq(0).text()
						const port = element.eq(1).text()
						const country = element.eq(3).text().toUpperCase()
						const anonymity = ANONIMITY_LEVELS.indexOf(
							element.eq(source.anonymity).text().toLowerCase()
						)
						const type = source.type(element)
						return { ip, port, country, anonymity, type }
					})
					.get()
			)
		)
	).then(datas => datas.reduce((prev, next) => prev.concat(next)))
}
