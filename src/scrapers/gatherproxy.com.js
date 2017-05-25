import url from 'url'
import nodeFetch from 'node-fetch'
import FormData from 'form-data'
import { Script } from 'vm'
import { extractProxies } from './text'
import cheerio from '../util/fetch-cheerio'
import Session from '../util/fetch-session'
import * as TempMail from '../util/temp-mail'
import debug from 'debug'
import fs from 'fs'

const log = debug('proxy-scraper:gatherproxy.com')

const CAPTCHA_REPLACE = {
	multiplied: '*',
	plus: '+',
	minus: '-',
	x: '*',
	zero: 0,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9
}

const ANONIMITY_LEVELS = ['transparent', 'anonymous', 'elite']

export default function scrap() {
	const session = new Session(nodeFetch)
	const fetch = (url, options) => session.fetch(url, options)
	return getAccount(fetch).then(() => {
		let chain = Promise.resolve([])
		for (let level of ANONIMITY_LEVELS) {
			chain = chain.then(data =>
				getProxyListId(fetch, level)
					.then(id => downloadProxyList(fetch, level, id))
					.then(text =>
						data.push(
							extractProxies(text, () => ({
								anonimity: ANONIMITY_LEVELS.indexOf(level),
								type: 'http'
							}))
						)
					)
					.then(() => data)
			)
		}
		return chain.then(datas => datas.reduce((prev, next) => prev.concat(next)))
	})
}

function getAccount(fetch) {
	return loadAccountFromCache()
		.then(({ email, password }) => {
			log(
				'Loaded account with email %s and password %s from .gatherproxy.account',
				email,
				password
			)
			return login(fetch, email, password)
		})
		.catch(() => {
			log('Invalid account in .gatherproxy.account, creating new one')
			return createAccount(fetch)
				.then(({ email, password }) => {
					log(
						'Storing account with email %s and password %s in .gatherproxy.account',
						email,
						password
					)
					return storeAccountToCache(email, password).catch(() => ({
						email,
						password
					}))
				})
				.then(({ email, password }) => login(fetch, email, password))
		})
}

function loadAccountFromCache() {
	return new Promise((resolve, reject) => {
		fs.readFile('./.gatherproxy.account', 'utf8', (err, data) => {
			if (err) reject(err)
			else resolve(JSON.parse(data))
		})
	})
}

function storeAccountToCache(email, password) {
	return new Promise((resolve, reject) => {
		fs.writeFile(
			'./.gatherproxy.account',
			JSON.stringify({ email, password }),
			err => {
				if (err) reject(err)
				else resolve({ email, password })
			}
		)
	})
}

function createAccount(fetch) {
	const email = `${Math.random().toString(36).substring(7)}@doanart.com` //@binka.me don't receive email
	log('Creating account with email %s', email)
	const form = new FormData()
	form.append('email', email)
	return fetch('http://www.gatherproxy.com/subscribe', {
		method: 'POST',
		body: form,
		headers: form.getHeaders()
	})
		.then(() => TempMail.poll(email))
		.then(
			([{ mail_text_only }]) => /<p>Password: (.*)<\/p>/.exec(mail_text_only)[1]
		)
		.then(password => {
			log('Account %s with password %s created', email, password)
			return { email, password }
		})
}

function login(fetch, email, password) {
	log('Logging in with email %s and password %s', email, password)
	return fetch('http://www.gatherproxy.com/subscribe/login')
		.then(cheerio())
		.then($ => {
			const captcha = $('#body > form > .label > .blue').first().text()

			const form = new FormData()
			form.append('Username', email)
			form.append('Password', password)
			form.append('Captcha', solveCaptcha(captcha))

			return fetch('http://www.gatherproxy.com/subscribe/login', {
				method: 'POST',
				body: form,
				headers: form.getHeaders()
			})
		})
}

function solveCaptcha(raw) {
	const captcha = raw
		.split(' ')
		.map(part => part.toLowerCase())
		.map(part => (part in CAPTCHA_REPLACE ? CAPTCHA_REPLACE[part] : part))

	captcha.splice(captcha.indexOf('='), 1) // Remove the =

	const c = captcha.join(' ')
	const result = new Script(c).runInNewContext({})

	log('Captcha %s (raw: %s) solved, result: %d', c, raw, result)
	return result
}

function getProxyListId(fetch, anonimity) {
	log('Getting id for anonimity %s', anonimity)
	const form = new FormData()
	form.append('Uptime', 0)
	form.append('Type', anonimity)
	return fetch('http://www.gatherproxy.com/proxylist/anonymityplaintext', {
		method: 'POST',
		body: form,
		headers: form.getHeaders(),
		redirect: 'manual'
	}).then(res => url.parse(res.headers.get('location'), true).query.sid)
}

function downloadProxyList(fetch, anonimity, id) {
	log('Downloading proxy with anonimity %s using id %s', anonimity, id)
	const form = new FormData()
	form.append('ID', id)
	form.append('T', anonimity)
	return fetch('http://www.gatherproxy.com/proxylist/downloadproxylist/', {
		method: 'POST',
		body: form,
		headers: form.getHeaders()
	}).then(res => res.text())
}
