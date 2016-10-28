"use strict";
const request = require('request-promise');
const cheerio = require('cheerio');

module.exports = function () {
    let promises = [];
    for(let offset = 0 ; offset < 1000 ; offset += 50){
        promises.push(request({
            uri: 'http://proxydb.net/',
            qs: {
                limit: 50,
                offset
            }
        }).then((body) => {
            cheerio.load(body);
        }).then(($) => {
            if(!$)
                return [];
            return $("table > tbody > tr").map((i , element) => {
                let ip = $(element).find('td > a').first().text().trim();
                let port = $(element).find('td').first().next().text();
                console.log("ip " + ip + " port " + port);
                return { ip , port }
            }).get();
        }));
    }
    return Promise.all(promises).then((values) => values.reduce((prev , next) => prev.concat(next)) , []);
};