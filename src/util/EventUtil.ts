import * as redis from "redis";

// thanks @subzey
// https://gist.github.com/jed/982883#gistcomment-45104
const uuid = () => {return(""+1e7+-1e3+-4e3+-8e3+-1e11).replace(/1|0/g,function(){return(0|Math.random()*16).toString(16)})}
const newRedis = () => redis.createClient({db: process.env.REDIS_PUBSUB_DB || 0});

const hset = process.env.REDIS_PUBSUB_SETNAME || 'pending';

class Event<T> {
    guid: string;
    channel: string;
    payload: T;
    action: string;
    once: boolean;

    constructor(payload: T, action?: string, once: boolean = false) {
        this.guid = uuid();
        this.channel = payload.constructor.name;
        Object.assign(this, {payload, action, once});
    }
}

const publisher = newRedis();

const _subscribe = (type: Function, target: Function, property: string): void => {
    let channel = type.name;
    console.log(`${target.name}.${property} is listening for ${channel}`);
    let subscriber = newRedis();
    subscriber.subscribe(channel);
    subscriber.on("message", async (ch, message) => {
        if (ch === channel) {
            let event = JSON.parse(message);
            console.log(ch, event);
            if(event.once) {
                let client = newRedis();
                client.hgetall(hset, (err, obj) => {
                    if (err) console.error(err);
                    if (obj[event.guid]) {
                        client.hdel(hset, event.guid);
                        target[property](event.payload, event.action);
                    }
                });
            } else {
                target[property](event.payload, event.action)
            }
        }
    });
};

export function publish (payload: any, action?: string, once?: boolean): void {
    let event = new Event(payload, action, once);
    publisher.publish(event.channel, JSON.stringify(event));
    if(event.once) newRedis().hset(hset, event.guid, 'pending');
}

export function subscribe(clazz: Function): Function;
export function subscribe(classes: Function[]): Function;
export function subscribe(classes: Function | Function[]): Function {
    return function (target: Function, propertyKey: string, descriptor: PropertyDescriptor) {
        if (Array.isArray(classes)) {
            classes.map(clazz => _subscribe(clazz, target, propertyKey))
        } else {
            _subscribe(classes, target, propertyKey)
        }
    };
}