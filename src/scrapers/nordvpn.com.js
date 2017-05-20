import fetch from 'node-fetch'
import Session from '../util/fetch-session'

export default function scrap() {
	const session = new Session(fetch)

	return session
		.fetch('https://nordvpn.com/free-proxy-list/')
		.then(() =>
			session.fetch(
				'https://nordvpn.com/wp-admin/admin-ajax.php?searchParameters%5B0%5D%5Bname%5D=proxy-country&searchParameters%5B0%5D%5Bvalue%5D=&searchParameters%5B1%5D%5Bname%5D=proxy-ports&searchParameters%5B1%5D%5Bvalue%5D=&offset=0&limit=100000&action=getProxies',
				{
					method: 'POST'
				}
			)
		)
		.then(res => res.json())
		.then(datas =>
			datas.map(({ ip, port, country, type }) => ({
				ip,
				port,
				country,
				type: type.toLowerCase()
			}))
		)
}
