import { getInbox } from 'temp-mail'
import debug from 'debug'

const log = debug('proxy-scraper:temp-mail')

const NOOP = function() {}

export * from 'temp-mail'

export function poll(email, interval = 5000, iterations = 20) {
	return new Promise((resolve, reject) => {
		let count = 0
		const id = setInterval(() => {
			if (count < iterations) {
				count++
				log(
					'Polling inbox for mail %s iteration %d, max: %d',
					email,
					count,
					iterations
				)
				getInbox(email)
					.then(mails => {
						resolve(mails)
						clearInterval(id)
					})
					.catch(NOOP) //Ignore Error
			} else {
				clearInterval(id)
				reject(new Error('Timeout exceeded, no messages found.'))
			}
		}, interval)
	})
}
