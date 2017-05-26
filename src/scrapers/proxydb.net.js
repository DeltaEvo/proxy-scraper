import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'

export default function scrap() {
	const promises = []
	for (let offset = 0; offset < 1000; offset += 50) {
		promises.push(
			fetch(`http://proxydb.net/?limit=50&offset=${offset}`)
				.then(cheerio())
				.then($ => {
					if (!$) return []
					return $('table > tbody > tr')
						.map((i, element) => {
							let url = $(element).find('td > a').first().text().trim()
							let ip = /(\d+\.){3}\d+/.exec(url)[0]
							let port = /\d+$/.exec(url)[0]

							return { ip, port }
						})
						.get()
				})
		)
	}
	return Promise.all(promises).then(
		values => values.reduce((prev, next) => prev.concat(next)),
		[]
	)
}
