"use strict";
const request = require("request");

class ProxyScraper {
    constructor (quiet) {
        this.quiet = quiet;
    }

    getProxies (timeout , minspeed) {
        return this.scrapProxies().then((proxies) => this.testProxies(timeout , minspeed , proxies));
    }

    testProxies (timeout , minspeed, proxies) {
        if(!minspeed) minspeed = Number.MAX_VALUE;
        let req = request.defaults({ timeout });
        this.log(`Testing ${proxies.length} proxies...`);
        let self = this;
        return new Promise(function (resolve) {
            let working = [];
            let count = {
                i: proxies.length,
                progress: self.quiet ? null : new (require('progress'))(':bar :percent :current'  , {total: proxies.length}),

                tick () {
                    if(this.i > 0 && this.progress)
                        this.progress.tick();
                    this.i--;
                    if(this.i == 0){
                        self.log("Sorting ...");
                        resolve(working.sort((a , b) => a.speed - b.speed));
                    }
                }
            };
            proxies.forEach((proxy) => {
                let r;
                let t = setTimeout(() => {
                    r.abort();
                    count.tick();
                }, timeout * 2);
                r =  req({
                    uri: 'http://goo.gl/',
                    proxy: proxy.port == 443 ? `https://${proxy.ip}`: `http://${proxy.ip}:${proxy.port}`,
                    time : true
                } , (error, response) => {
                    if(!error && response.elapsedTime < minspeed) {
                        proxy.speed = response.elapsedTime;
                        working.push(proxy);
                    }
                    clearTimeout(t);
                    count.tick();
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
                proxies.forEach((proxy) => proxy.source = scraper);
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