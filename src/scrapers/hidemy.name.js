import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'

export let maxtime = 1000

export default function scrap() {
	return fetch(
		`https://hidemy.name/en/proxy-list/?maxtime=${maxtime}&type=hs`,
		{
			headers: {
				'User-Agent': 'Mozilla/5.0'
			}
		}
	)
		.then(cheerio())
		.then($ => {
			return $('.proxy__t > tbody > tr')
				.map((i, e) => {
					const element = $(e).find('td')
					const ip = $(element).find('td').eq(0).text()
					const port = $(element).find('td').eq(1).text()
					return { ip, port }
				})
				.get()
		})
}
