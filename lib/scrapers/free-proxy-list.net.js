const request = require('request-promise');
const cheerio = require('cheerio');

module.exports = function () {
    return request('http://www.free-proxy-list.net')
        .then((body) => cheerio.load(body))
        .then(($) => {
            return $("#proxylisttable > tbody > tr").map((i , element) => {
                let ip = $(element).find('td').first().text();
                let port = $(element).find('td').first().next().text();
                return { ip , port }
            }).get();
        });
};
