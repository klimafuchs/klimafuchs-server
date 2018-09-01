import {Arg, Authorized, Int, Mutation, Query, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/User";
import {Repository} from "typeorm";
import {FeedPost} from "../entity/FeedPost";
import {UserInput} from "./types/UserInput";
import {Media} from "../entity/Media";

@Resolver()
export class UserResolver {
    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) {
    }

    @Authorized("ADMIN")
    @Query(returns => [User], {nullable: true})
    users(): Promise<User[]> {
        return this.userRepository.find();
    }

    @Authorized("ADMIN")
    @Query(returns => User, {nullable: true})
    user(@Arg("userId", type => Int) userId: number): Promise<User> {
        return this.userRepository.findOne(userId);
    }

    /*
    @Authorized("ADMIN")
    @Mutation(returns => User, {nullable: true})
    async banUser(@Arg("userId", type => Int) userId: number): Promise<User> {
        const user = await this.userRepository.findOne(userId);
        user.isBanned = true;
        return this.userRepository.save(user);
    }*/

    @Authorized("ADMIN")
    @Mutation(returns => User, {nullable: true})
    async changeUser(@Arg("user", type => UserInput) userInput: UserInput): Promise<User> {
        const user = await this.userRepository.findOne(userInput.id);
        user.screenName= userInput.screenName;
        user.userName = userInput.userName;
        user.isBanned = userInput.isBanned;
        user.emailConfirmed = userInput.emailConfirmed; // TODO reset Avatars
        return this.userRepository.save(user)
    }

}