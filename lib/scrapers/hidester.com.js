"use strict";
const request = require('request-promise');

module.exports = function () {

    return request({
        uri: 'https://hidester.com/proxydata/php/data.php',
        qs: {
            mykey: "data",
            offset: "0",
            limit: "500",
            orderBy: "latest_check",
            sortOrder: "DESC",
            type: "3",
            anonymity: "7",
            ping: "7",
            gproxy: "2"
        },
        json: true
    }).then((data) => {
        let proxies = [];
        for (let key in data) {
            proxies.push({
                ip: data[key]["IP"],
                port: data[key]["PORT"]
            });
        }
        return proxies;
    });
};