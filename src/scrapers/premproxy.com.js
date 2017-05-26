import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'

const ANONIMITY_LEVELS = ['transparent', 'anonymous', 'high-anonymous']

const SOURCES = [
	{
		url: 'https://premproxy.com/list/',
		data(element) {
			return {
				type: 'http',
				anonymity: element.eq(1).text().trim().toLowerCase()
			}
		},
		pages: 20
	},
	{
		url: 'https://premproxy.com/socks-list/',
		data(element) {
			return {
				type: element.eq(1).text().trim().toLowerCase()
			}
		},
		pages: 5
	}
]

export default function scrap() {
	return Promise.all(
		SOURCES.map(source => {
			const promises = []
			for (let i = 1; i <= source.pages; i++) {
				promises.push(
					fetch(`${source.url}/${i > 9 ? i : '0' + i}.htm`)
						.then(cheerio())
						.then($ =>
							$('#proxylist > tr:not(.list_sorted)')
								.map((i, e) => {
									const element = $(e).find('td')
									const [ip, port] = element.eq(0).text().split(':')
									const data = source.data(element)
									const country = element.eq(3).text().toUpperCase()
									return { ip, port, country, ...data }
								})
								.get()
						)
				)
			}
			return Promise.all(promises).then(values =>
				values.reduce((prev, next) => prev.concat(next))
			)
		})
	).then(values => values.reduce((prev, next) => prev.concat(next)))
}
