const request = require('request');
const schedule = require('node-schedule');
var fs = require('fs');
require('date-utils');

// 
var statusMap = new Map();
var tryCountMap = new Map();

// Read config.json
const msg = fs.readFileSync("config.json", { encoding: "utf-8" });
var config = JSON.parse(msg);

// Init state map.
var targetUrlList = config.target_url;
for (const targetUrl of targetUrlList) {
    statusMap.set(targetUrl, 200);
    tryCountMap.set(targetUrl, 0);
}

// 
schedule.scheduleJob('*/10 * * * * *', () => {
    checkHTTPstatus();
});

// 
function checkHTTPstatus() {
    var dt = new Date();
    console.log("====" + dt.toFormat("YYYY/MM/DD HH24:MI:SS") + "====");
    var targetUrlList = config.target_url;
    for (const targetUrl of targetUrlList) {
        getHTTPstatuscode(targetUrl).then(function (result) {
            var isNotify = isNeedNotice(targetUrl, result.code);
            if (isNotify) {
                sendNotification(targetUrl, result)
            }
            setStatusMap(targetUrl, result.code);
            console.log(targetUrl, result, isNotify);
        })
    }
}

// 
function isNeedNotice(url, statusCode) {
    var previousCode = statusMap.get(url);
    if (previousCode != statusCode && statusCode == 200) {
        return true;
    } else {
        if (tryCountMap.get(url) == config.try_count) {
            return true;
        }
        return false;
    }
}

// 
function setStatusMap(url, statusCode) {
    statusMap.set(url, statusCode);
    if (statusCode == 200) {
        tryCountMap.set(url, 0);
    } else {
        tryCountMap.set(url, tryCountMap.get(url) + 1);
    }
}

// 
function sendNotification(url, result) {
    var dt = new Date();
    var formatted = dt.toFormat("YYYY/MM/DD HH24:MI:SS");
    if (result.code == 200) {
        var options = {
            uri: config.slack_webhook_url,
            headers: {
                "Content-type": "application/json",
            },
            json: {
                "channel": config.slack_channel,
                "username": config.slack_username,
                "icon_emoji": config.slack_icon,
                "attachments": [
                    {
                        "fallback": "Message",
                        "color": config.slack_color_good,
                        "fields": [
                            {
                                "title": config.slack_title_good,
                                "value": formatted + "\n" + url + "",
                                "short": false
                            }
                        ]
                    }
                ]
            }
        };
        request.post(options, function (error, response, body) { });
    } else {
        if (result.error == undefined) {
            result.error = result.code;
        }
        var options = {
            uri: config.slack_webhook_url,
            headers: {
                "Content-type": "application/json",
            },
            json: {
                "channel": config.slack_channel,
                "username": config.slack_username,
                "icon_emoji": config.slack_icon,
                "attachments": [
                    {
                        "fallback": "Message",
                        "color": config.slack_color_bad,
                        "fields": [
                            {
                                "title": config.slack_title_bad,
                                "value": formatted + "\n" + url + "\n" + result.error,
                                "short": false
                            }
                        ]
                    }
                ]
            }
        };
        request.post(options, function (error, response, body) { });
    }
}

// Return HTTP Status Code.(and error code if exists.)
function getHTTPstatuscode(url) {
    return new Promise(function (resolve) {
        request(url, { timeout: 5000 }, (err, res) => {
            if (err !== null) {
                resolve({ "code": 0, "error": err.code })
                return;
            }
            resolve({ "code": res.statusCode });
        });
    })
}