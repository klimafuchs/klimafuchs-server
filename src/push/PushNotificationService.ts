import Expo, {ExpoPushMessage, ExpoPushToken} from 'expo-server-sdk';
import {Subscription} from "../entity/user/Subscription";

export class PushNotificationService {
    private expo = new Expo();
    private _queue : ExpoPushMessage[]  = []

    private _pushAllMessages = async () => {
        let chunks = this.expo.chunkPushNotifications(this._queue);
        this._queue = [];
        let tickets = [];
        chunks.forEach(async chunk => {
            try {
                let ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
            } catch (e) {
                console.error(e)
            }
        })
    };

    public async sendTestNotification(subscription: Subscription) {
        let message = {
            to: subscription.pushToken,
            body: 'This is a test notification',
            data: { withSome: 'data' },
        };
        await this.expo.sendPushNotificationsAsync([message])
    }
}