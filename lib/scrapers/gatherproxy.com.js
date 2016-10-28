"use strict";
const request = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

module.exports = function () {
    return request('http://gatherproxy.com/')
        .then((body) => cheerio.load(body))
        .then(($) => {
            let sandbox = {
                gp: {
                    insertPrx (object) {
                        sandbox.proxy = {ip: object["PROXY_IP"], port: parseInt(object["PROXY_PORT"] , 16)}
                    }
                },
                proxy: null
            };
            return $("div script").map((i , element) => {
                new vm.Script($(element).text()).runInNewContext(sandbox);
                return sandbox.proxy;
            }).get();
        });
};