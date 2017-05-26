import fetch from 'node-fetch'
import cheerio from '../util/fetch-cheerio'
import { extractProxies } from './text'

const SOURCES = [
	{
		url: 'http://proxyserverlist-24.blogspot.fr/',
		type: 'http',
		selector: '.post-body > pre > span > span:nth-child(2)'
	},
	{
		url: 'http://sslproxies24.blogspot.fr/',
		type: 'https',
		selector: '.post-body > pre > span > span'
	},
	{
		url: 'http://vip-socks24.blogspot.com/',
		type: 'socks5',
		selector: '.post-body > textarea'
	}
]

export default function scrap() {
	const result = []
	for (const source of SOURCES) {
		result.push(
			fetch(source.url)
				.then(cheerio())
				.then($ =>
					Promise.all(
						$('.post-title > a')
							.map((i, e) =>
								fetch($(e).attr('href'))
									.then(cheerio())
									.then($ => $(source.selector).eq(0).text())
									.then(proxies =>
										extractProxies(proxies, () => ({ type: source.type }))
									)
							)
							.get()
					).then(datas => datas.reduce((prev, next) => prev.concat(next)))
				)
		)
	}
	return Promise.all(result).then(datas =>
		datas.reduce((prev, next) => prev.concat(next))
	)
}
