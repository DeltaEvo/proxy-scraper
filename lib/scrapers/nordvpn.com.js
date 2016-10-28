const request = require('request-promise');
const cheerio = require('cheerio');

module.exports = function () {

    let cookies = request.jar();

    return request({
        uri: 'https://nordvpn.com/free-proxy-list/',
        jar: cookies
    }).then(() => request({
        method: 'POST',
        uri: 'https://nordvpn.com/wp-admin/admin-ajax.php?searchParameters%5B0%5D%5Bname%5D=proxy-country&searchParameters%5B0%5D%5Bvalue%5D=&searchParameters%5B1%5D%5Bname%5D=proxy-ports&searchParameters%5B1%5D%5Bvalue%5D=&offset=0&limit=1000&action=getProxies',
        jar: cookies,
        json: true
    })).then((data) => {
        let proxies = [];
        for (let key in data) {
            proxies.push({
                ip: data[key]["ip"],
                port: data[key]["port"]
            });
        }
        return proxies;
    });
};
