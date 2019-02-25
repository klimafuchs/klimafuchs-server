import {EntityRepository, FindConditions, Repository} from "typeorm";
import {ConnectionArgs} from "../resolver/types/ConnectionPaging";
import * as Relay from "graphql-relay";
import {connectionFromArraySlice, Edge} from "graphql-relay";
import {FeedPost} from "../entity/social/FeedPost";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../entity/user/User";
import {Team} from "../entity/social/Team";

export class PaginatingRepository<T> extends Repository<T> {
    async findAndPaginate(conditions: FindConditions<T>, order, connArgs: ConnectionArgs) {
        const {limit, offset} = connArgs.pagingParams();
        const [entities, count] = await this.findAndCount({
            where: conditions,
            order: order,
            skip: offset,
            take: limit,
        });
        const page = connectionFromArraySlice(entities, connArgs, {arrayLength: count, sliceStart: offset || 0});
        return {
            page,
            pageData: {
                count,
                limit,
                offset,
            }
        }
    }
}

@EntityRepository(FeedPost) // toll
export class PaginatingFeedPostRepository extends PaginatingRepository<FeedPost> {}

@EntityRepository(User) // toll
export class PaginatingUserRepository extends PaginatingRepository<FeedPost> {}

@EntityRepository(Team)
export class LeaderBoardRepository extends PaginatingRepository<Team>{}

@ObjectType(`PageData`)
export class PageData {
    @Field(type => Int)
    count;
    @Field(type => Int)
    limit;
    @Field(type => Int)
    offset;
}
