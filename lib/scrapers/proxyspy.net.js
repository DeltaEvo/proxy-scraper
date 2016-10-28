const request = require('request-promise');

module.exports = function () {
    return request('http://txt.proxyspy.net/proxy.txt')
        .then((body) => {
            let lines = body.split('\n');
            let proxies = [];
            lines.forEach((line) => {
                let match = /((?:\d+.){4}):(\d+)/g.exec(line);
                if(match)
                    proxies.push({
                        ip : match[1],
                        port: match[2]
                    })
            });
            return proxies;
        });
};
