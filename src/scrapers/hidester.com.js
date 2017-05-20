import fetch from 'node-fetch'

const ANONIMITY_LEVELS = ['transparent', 'anonymous', 'elite']

export default function scrap(types) {
	return fetch(
		'https://hidester.com/proxydata/php/data.php?mykey=csv&gproxy=2',
		{
			headers: {
				Referer: 'https://hidester.com/proxylist/'
			}
		}
	)
		.then(req => req.json())
		.then(datas =>
			datas.map(({ IP: ip, PORT: port, type, country, anonymity }) => ({
				ip,
				port,
				type,
				country,
				anonimity: ANONIMITY_LEVELS.indexOf(anonymity.toLowerCase())
			}))
		)
}
