import {Arg, Ctx, Field, InputType, Int, ObjectType, Query, registerEnumType, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/user/User";
import {Repository} from "typeorm";
import {Media} from "../entity/Media";
import {Member} from "../entity/social/Member";
import {Team} from "../entity/social/Team";
import {ConnectionArgs} from "./types/ConnectionPaging";
import {Context} from "./types/Context";

enum TeamSize {
    SOLO, DUO, SMALL, LARGE, HUGE
}

registerEnumType(TeamSize, {
    name: 'TeamSize',
    description: 'team size brackets'
});

@ObjectType()
export class LeaderBoardEntry {
    @Field(type => Int)
    place: number

    @Field(type => Team)
    team: Team;
}

@Resolver()
export class LeaderBoardResolver {
    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
        @InjectRepository(Member) private readonly memberRepository: Repository<Member>
    ) {
    }

    @Query(returns => [LeaderBoardEntry], {nullable: true})
    async getLeaderBoard (
        @Ctx() {user}: Context,
        @Arg('connectionArgs', type => ConnectionArgs) connectionArgs: ConnectionArgs,
        @Arg('teamSize', type => TeamSize) searchConditions: TeamSize,
    ) : Promise<LeaderBoardEntry[]>{
        return Promise.reject("not implemented")
    }

}
