import $ from 'cheerio'

export default function cheerio(options) {
	return req => req.text().then(body => $.load(body, options))
}
