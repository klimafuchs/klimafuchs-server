import {Arg, Ctx, Field, InputType, Int, ObjectType, Query, registerEnumType, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/user/User";
import {getCustomRepository, Repository} from "typeorm";
import {Media} from "../entity/Media";
import {Membership} from "../entity/social/Membership";
import {Team, TeamSize} from "../entity/social/Team";
import {ConnectionArgs} from "./types/ConnectionPaging";
import {Context} from "./types/Context";
import {PaginatingTeamRepository} from "../util/PaginatingRepository";
import {connectionTypes} from "../util/ConnectionTypes";



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
        @InjectRepository(Membership) private readonly memberRepository: Repository<Membership>
    ) {
    }

    @Query(returns => connectionTypes<Team>('LeaderBoardEntry', Team), {nullable: true})
    async getLeaderBoard (
        @Ctx() {user}: Context,
        @Arg('connectionArgs', type => ConnectionArgs) connectionArgs: ConnectionArgs,
        @Arg('teamSize', type => TeamSize) searchConditions: TeamSize,
    ) {
        const paginatingRepo = getCustomRepository(PaginatingTeamRepository);
        return paginatingRepo.findAndPaginate({teamSize: searchConditions}, {score: "DESC"}, connectionArgs);
    }

}
