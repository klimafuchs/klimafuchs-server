import {Arg, Ctx, Mutation, Query, registerEnumType, Resolver} from "type-graphql";
import {GameProgressionManager} from "../gameLogic/GameProgressionManager";
import {Container} from "typedi";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/user/User";
import {Repository} from "typeorm";
import {Subscription} from "../entity/user/Subscription";
import {PushNotificationService} from "../push/PushNotificationService"
import Expo from "expo-server-sdk";

export enum PushNotificationResolverErrors {
    ERR_INVALID_TOKEN = "ERR_INVALID_TOKEN",
    ERR_ALREADY_SUBSCRIBED = "ERR_ALREADY_SUBSCRIBED",
    ERR_NOT_SUBSCRIBED = "ERR_NOT_SUBSCRIBED"
}

registerEnumType(PushNotificationResolverErrors, {
    name: 'PushNotificationResolverErrors',
    description: 'Error conditions raised by PushNotificationResolver.js'
});

@Resolver()
export class PushNotificationResolver {

    private gameStateManager: GameProgressionManager = Container.get(GameProgressionManager);
    private pushNotificationService: PushNotificationService = Container.get(PushNotificationService);

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>

    ){}

    @Mutation(returns => Subscription, {nullable: true})
    async subscribe(@Arg("pushToken", type => String) pushToken: string , @Ctx() {user}): Promise<Subscription>{

        if(!Expo.isExpoPushToken(pushToken)) return Promise.reject(PushNotificationResolverErrors.ERR_INVALID_TOKEN);

        const currentSubscription = await this.subscriptionRepository.findOne({where: {user: {id : user.id}}});
        if(currentSubscription) return Promise.reject(PushNotificationResolverErrors.ERR_ALREADY_SUBSCRIBED);

        let subscription = new Subscription();
        subscription.user = user;
        subscription.pushToken = pushToken;

        return this.subscriptionRepository.save(subscription);
    }

    @Mutation(returns => Subscription, {nullable: true})
    async unsubscribe(@Ctx() {user}): Promise<Subscription>{

        const subscription = await this.subscriptionRepository.findOne({where: {user: {id : user.id}}});
        if(subscription)
            return this.subscriptionRepository.remove(subscription);

        return Promise.reject(PushNotificationResolverErrors.ERR_NOT_SUBSCRIBED)
    }

    @Query(returns => Subscription, {nullable: true})
    async isSubscribed(@Ctx() {user}): Promise<Subscription>{
        return this.subscriptionRepository.findOne({where: {user: {id : user.id}}})
    }

    @Mutation(returns => Boolean, {nullable: true})
    async testNotification(@Ctx() {user}): Promise<Boolean>{
        const subscription = await this.subscriptionRepository.findOne({where: {user: {id : user.id}}});
        if(subscription) {
            this.pushNotificationService.sendTestNotification(subscription)
            return true;
        }
        return Promise.reject(PushNotificationResolverErrors.ERR_NOT_SUBSCRIBED)

    }
}