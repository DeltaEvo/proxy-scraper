"use strict";
const requestp = require("request-promise");

class ProxyScraper {
    constructor (quiet) {
        this.quiet = quiet;
    }

    getProxies (timeout , minspeed) {
        return this.scrapProxies().then((proxies) => this.testProxies(timeout , minspeed , proxies));
    }

    testProxies (timeout , minspeed, proxies) {
        if(!minspeed) minspeed = Number.MAX_VALUE;
        let request = requestp.defaults({ timeout });
        let progress;
        if(!this.quiet)
            progress = new (require('progress'))(':bar :percent :current'  , {total: proxies.length});
        let working = [];
        this.log(`Testing ${proxies.length} proxies...`);
        return new Promise(function (resolve) {
            var count = proxies.length;
            proxies.map((proxy) => {
                return request({
                    uri: 'http://goo.gl/',
                    proxy: proxy.port == 443 ? `https://${proxy.ip}`: `http://${proxy.ip}:${proxy.port}`,
                    resolveWithFullResponse: true,
                    time : true
                }).then((response) => {
                    if(response.elapsedTime < minspeed)
                        working.push({
                            ip: proxy.ip,
                            port: proxy.port,
                            speed: response.elapsedTime
                        });
                }).catch((err) => {/*Ignored*/}).then(() => {
                    if(progress)
                        progress.tick();
                    count--;
                    if(count == 0){
                        this.log("Sorting ...");
                        resolve(working.sort((a , b) => a.speed - b.speed));
                    }
                });
            })
        });
    }

    scrapProxies () {
        let scrapers = require("./lib/scrapers");
        let proxies = [];
        for(let scraper in scrapers ) {
            proxies.push(scrapers[scraper]().then((proxies) => {
                this.log("Found " + proxies.length + " proxies from " + scraper);
                return proxies;
            }))
        }
        return Promise.all(proxies).then((values) => values.reduce((prev , next) => prev.concat(next)) , []);
    }

    log (message) {
        if(!this.quiet)
            console.log(message);
    }
}

module.exports = ProxyScraper;