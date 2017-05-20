export default class Lock {
	constructor(inner) {
		this.inner = Promise.resolve(inner)
	}

	get(callback) {
		const p = this.inner.then(inner => {
			const result = callback(inner)
			return Promise.resolve(result).then(
				result => ({ inner, result }),
				err => ({ inner, err })
			)
		})
		this.inner = p.then(({ inner }) => inner)
		return p.then(({ result, err }) => (err ? Promise.reject(err) : result))
	}
}
