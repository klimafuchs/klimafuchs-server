import {Challenge} from "./entity/Challenge";
import {getRepository, LessThan, MoreThan} from "typeorm";
import {DateUtils} from "typeorm/util/DateUtils";
import * as schedule from 'node-schedule';
import {DailyChallenge} from "./entity/DailyChallenge";
import {Subscription} from "./entity/Subscription";
import * as webPush from 'web-push';
import * as nodemailer from 'nodemailer';
//import * as sendmail from 'sendmail';
import {PasswordResetToken} from "./entity/PasswordResetToken";

export class Tasks {

    public dbChallengeUpdateJob;
    public dbDailyUpdateJob;

    public constructor() {
        let dbAdvanceChallengesTimer = new schedule.RecurrenceRule();
        dbAdvanceChallengesTimer.hour = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        dbAdvanceChallengesTimer.minute = 0;
        this.dbChallengeUpdateJob = schedule.scheduleJob(dbAdvanceChallengesTimer, this.dbChallengeUpdate);
        this.dbDailyUpdateJob = schedule.scheduleJob(dbAdvanceChallengesTimer, this.dbDailyUpdate);

    }


    //TODO deduplicate
    async dbChallengeUpdate() {
        let now = new Date(Date.now());
        let nowString = DateUtils.mixedDateToDatetimeString(now);
        let currentActiveChallenge = await getRepository(Challenge).findOne({where: {active: true}})
        currentActiveChallenge.active = currentActiveChallenge.startDate.getTime() < now.getTime()
            && currentActiveChallenge.endDate.getTime() >= now.getTime();
        if (!currentActiveChallenge || !currentActiveChallenge.active) {
            console.log("Advancing to next challenge");
            let newActiveChallenge = await getRepository(Challenge).findOne({startDate: LessThan(nowString), endDate: MoreThan(nowString)});
            if(newActiveChallenge) {
                console.log("New challenge: ", newActiveChallenge.id + " " + newActiveChallenge.title);
                newActiveChallenge.active = true;
                currentActiveChallenge ? await getRepository(Challenge).save(currentActiveChallenge) : {};
                await getRepository(Challenge).save(newActiveChallenge);
                Tasks.sendNotificationNewChallenge(newActiveChallenge);
            } else {
                console.error("No more challenges")
            }
        } else {
            console.log("Challenge not yet over");
            let deltaT = (currentActiveChallenge.endDate.getTime() - now.getTime())/ 36e5;
            console.log("Time remaining: " +deltaT)
            if(deltaT < 24 && deltaT > 22.9) {
                Tasks.sendNotificationWarnChallengeExpire(deltaT).then().catch((err)=> console.log(err));
            }
        }
    }

    async dbDailyUpdate() {
        let now = new Date(Date.now());
        let nowString = DateUtils.mixedDateToDatetimeString(now);
        let currentActiveChallenge = await getRepository(DailyChallenge).findOne({where: {active: true}})
        currentActiveChallenge.active = currentActiveChallenge.startDate.getTime() < now.getTime()
            && currentActiveChallenge.endDate.getTime() >= now.getTime();
        if (!currentActiveChallenge || !currentActiveChallenge.active) {
            console.log("Advancing to next daily");
            let newActiveChallenge = await getRepository(DailyChallenge).findOne({startDate: LessThan(nowString), endDate: MoreThan(nowString)});
            if(newActiveChallenge) {
                console.log("New daily: ", newActiveChallenge.id + " " + newActiveChallenge.title);
                newActiveChallenge.active = true;
                currentActiveChallenge ? await getRepository(DailyChallenge).save(currentActiveChallenge) : {};
                await getRepository(DailyChallenge).save(newActiveChallenge);
            } else {
                console.error("No more daily")
            }
        } else {
            console.log("Challenge not yet over");
        }
    }

    static async sendNotificationWarnChallengeExpire(deltaT: number) {
        await Tasks.sendNotification({title: "Enviroommate",message: "Die aktuelle Challenge läuft nur noch " + deltaT.toFixed(0) + " Stunden." }).then(() => console.log("send reminder notifications")).catch(err => console.error(err))
    }

    static async sendNotification(param) {
        const options = {
            TTL: 60 * 60 * 24
        };
        let subscriptions = await getRepository(Subscription).find();
        subscriptions.forEach((val,i,subs) => {
            const subscription = Subscription.build(val.endpoint, val.auth, val.p256dh);
            webPush.sendNotification(subscription, JSON.stringify(param), options)
                .then(function() {
                    console.log("send notification to " + JSON.stringify(subscription));
                })
                .catch(function(err) {
                    if (err.statusCode === 410) {
                        return Tasks.deleteSubscriptionFromDatabase(val.id);
                    } else {
                        console.log('Subscription is no longer valid: ', err);
                    }
                });
        }, 60 * 60 * 24 * 1000);
    }

    private static deleteSubscriptionFromDatabase(id: number) {
        getRepository(Subscription).delete({id: id}).catch(err => console.log(err))
    }

    private static sendNotificationNewChallenge(newActiveChallenge: Challenge) {
        Tasks.sendNotification({title: "Neue Wochenchallenge", message: newActiveChallenge.title}).catch((err) => console.error(err))
    }

    public static async sendPasswordReset(userId) {

        let token = await getRepository(PasswordResetToken).findOne({user: userId});
        if(!token) return;
        const sendmail = require('sendmail')({
            logger: {
                debug: console.log,
                info: console.info,
                warn: console.warn,
                error: console.error
            },
            silent: false,
            dkim: false,
        })
        sendmail({
            from: 'no-reply@enviroommate.org',
            to: token.user.userName,
            subject: 'Enviroommate Passwort zurücksetzen',
            text: 'https://enviroommate.org/#/resetPassword?resettoken=' + token.resetToken,
        }, function(err, reply) {
            console.log(err && err.stack);
            console.log(reply);
        });
    }
}
