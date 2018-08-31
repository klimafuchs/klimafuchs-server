import {Arg, Authorized, Int, Mutation, Query, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/User";
import {Repository} from "typeorm";
import {FeedPost} from "../entity/FeedPost";

@Resolver()
export class UserResolver {
    constructor(
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
    changeUser(@Arg("user", type => User) user: User): Promise<User> {
        return this.userRepository.save(user)
    }

}