import {Container, Service} from "typedi";
import * as redis from "redis";
import {RedisClient} from "redis";

let config = require("../../config.json");


export class Event<T> {
    channel: string;
    payload: T;

    constructor(payload: T) {
        this.channel = payload.constructor.name;
        this.payload = payload;
    }
}

class Subscriber {
    channel: string;
    listener: Function;
}

@Service()
export class EventService {

    readonly redis: RedisClient;

    constructor() {
        this.redis = redis.createClient({db: config.redisDb});
    }

    public subscribe(type: Function, target: Function, property: string): void {

        let channel = type.name;
        let client = redis.createClient({db: config.redisDb});
        client.subscribe(channel);
        client.on("message", (ch, message) => {
            if(ch === channel) {
                target[property](JSON.parse(message).payload)
            }
        });
    }

    public publish(payload: any): void {
        let event = new Event(payload);
        console.log(event)
        this.redis.publish(event.channel, JSON.stringify(event));
    }
}

export function subscribe(clazz: Function): Function;
export function subscribe(classes: Function[]): Function;
export function subscribe(classes: Function | Function[]): Function {
    return function (target: Function, propertyKey: string, descriptor: PropertyDescriptor) {
        let es = Container.get(EventService);
        if(typeof classes == 'object') {
            classes.map(clazz => es.subscribe(clazz, target, propertyKey))
        } else {
            es.subscribe(classes, target, propertyKey)
        }
    };
}