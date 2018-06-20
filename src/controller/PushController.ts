import * as webPush from 'web-push';
import {Router, Request, Response} from "express";
import * as bodyParser from "body-parser"
import {getRepository} from "typeorm";
import {Subscription} from "../entity/Subscription";

let config = require("../../config.json");


if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY "+
        "environment variables. You can use the following ones:");
    console.log(webPush.generateVAPIDKeys());
    process.exit(-1);
}

let router = Router();
router.use(bodyParser.json());

webPush.setVapidDetails(
    config.domain,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

router.get("/vapidPublicKey", (request: Request, response: Response, done: Function) => {
    response.send(process.env.VAPID_PUBLIC_KEY);
    done();
});

router.post('/register', async (request: Request, response: Response, done: Function) => {
    //TODO store this
    const subscription = request.body.subscription;
    console.log(subscription);
    let s = new Subscription();
    s.auth = subscription.keys.auth;
    s.p256dh = subscription.keys.p256dh;
    s.endpoint = subscription.endpoint;
    let alreadyRegistered = await getRepository(Subscription).findOne({where: {endpoint: s.endpoint}});
    if(alreadyRegistered) {
        response.sendStatus(304);
    } else {
        await getRepository(Subscription).save(s);
        response.sendStatus(201);
    }
});


router.post('/sendNotification', (request: Request, response: Response, done: Function) => {
    const subscription = request.body.subscription;
    const payload = request.body.payload;
    const options = {
        TTL: request.body.ttl
    };

    setTimeout(function() {
        webPush.sendNotification(subscription, null, options)
            .then(function() {
                response.sendStatus(201);
            })
            .catch(function(error) {
                response.sendStatus(500);
                console.log(error);
            });
    }, 1 * 1000);
});


export {router as PushController} ;