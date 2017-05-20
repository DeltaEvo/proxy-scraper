import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'

const ANONIMITY_LEVELS = ['transparent', 'anonymous', 'elite proxy']

export default function scrap() {
	return fetch('http://www.free-proxy-list.net').then(cheerio()).then($ =>
		$('#proxylisttable > tbody > tr')
			.map((i, e) => {
				const element = $(e).find('td')
				const ip = element.eq(0).text()
				const port = element.eq(1).text()
				const country = element.eq(3).text().toUpperCase()
				const anonymity = ANONIMITY_LEVELS.indexOf(element.eq(4).text())
				const type = element.eq(5).text() == 'yes' ? 'https' : 'http'
				return { ip, port, country, anonymity, type }
			})
			.get()
	)
}
