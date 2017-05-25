import createTextScraper from './text'

const ANONIMITY_LEVELS = ['N', 'A', 'H']

export default createTextScraper('http://spys.me/proxy.txt', data => {
	const [country, anonymity, ssl = 'N'] = data[0].split('-')
	return {
		type: ssl.charAt(0) === 'S' ? 'https' : 'http',
		country,
		anonymity: ANONIMITY_LEVELS.indexOf(anonymity)
	}
})
