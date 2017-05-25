import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'
import { validIp, validPort } from './text'

export default function scrap() {
	const proxies = []
	for (let i = 0; i < 20; i++) {
		proxies.push(
			fetch(`https://hidemy.name/en/proxy-list/?start=${i * 64}`, {
				headers: {
					'User-Agent': 'Mozilla/5.0'
				}
			})
				.then(cheerio())
				.then($ => {
					return $('.proxy__t > tbody > tr')
						.map((i, e) => {
							const element = $(e).find('td')
							const ip = element.eq(0).text()
							const port = element.eq(1).text()
							const type = element.eq(4).text().split(',')[0].toLowerCase()
							if (validIp(ip) && validPort(port)) return { ip, port, type }
						})
						.filter(e => e !== undefined)
						.get()
				})
		)
	}
	return Promise.all(proxies).then(datas =>
		datas.reduce((prev, next) => prev.concat(next))
	)
}
