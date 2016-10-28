const request = require('request-promise');
const cheerio = require('cheerio');

let maxtime = 1000;

module.exports = function () {
    return request({
        url: `https://incloak.com/proxy-list/?maxtime=${maxtime}&type=hs`,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    }).then((body) => cheerio.load(body)).then(($) => {
            return $(".proxy__t > tbody > tr").map((i , element) => {
                let ip = $(element).find('td').first().text();
                let port = $(element).find('td').first().next().text();
                return { ip , port }
            }).get();
        });
};

module.exports.maxtime = maxtime;