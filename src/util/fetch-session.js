import { CookieJar } from 'tough-cookie'

export default class Session {
	constructor(fetch) {
		this.jar = new CookieJar()
		this._fetch = fetch
	}

	fetch(url, opts = {}) {
		return this.getCookies(url).then(cookies => {
			return this._fetch(
				url,
				Object.assign(opts, {
					headers: Object.assign(opts.headers || {}, {
						cookie: cookies.join('; ')
					})
				})
			).then(res => {
				let cookies = res.headers.get('set-cookie')
				cookies = (cookies && cookies.split(',')) || []
				cookies.map(cookie => this.jar.setCookie(cookie, url, () => null))
				return res
			})
		})
	}

	getCookies(url) {
		return new Promise((resolve, reject) => {
			this.jar.getCookies(url, (err, cookies) => {
				if (err) reject(err)
				else resolve(cookies)
			})
		})
	}
}
