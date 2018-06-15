import webPush from 'web-push';
let config = require("../config.json");


if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY "+
        "environment variables. You can use the following ones:");
    console.log(webPush.generateVAPIDKeys());
    process.exit(-1);
}

webPush.setVapidDetails(
    config.domain,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

module.exports