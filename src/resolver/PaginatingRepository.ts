import {EntityRepository, FindConditions, Repository} from "typeorm";
import {ConnectionArgs} from "./types/ConnectionPaging";
import * as Relay from "graphql-relay";
import {connectionFromArraySlice, Edge} from "graphql-relay";
import {FeedPost} from "../entity/social/FeedPost";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../entity/user/User";

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
export class PaginatingFeedPostRepository extends PaginatingRepository<FeedPost> {

}

@EntityRepository(User) // toll
export class PaginatingUserRepository extends PaginatingRepository<FeedPost> {

}


@ObjectType(`PageData`)
export class PageData {
    @Field(type => Int)
    count;
    @Field(type => Int)
    limit;
    @Field(type => Int)
    offset;
}


@ObjectType(`FeedPostEdge`)
export class FeedPostEdge implements Relay.Edge<FeedPost> {

    @Field()
    cursor!: Relay.ConnectionCursor;

    @Field(type => FeedPost)
    node!: FeedPost;

    @Field(type => String)
    cursorDecoded() {
        return Relay.fromGlobalId(this.cursor)
    }
}

@ObjectType(`FeedPostConnection`)
export class FeedPostConnection implements Relay.Connection<FeedPost> {
    @Field(type => FeedPostEdge)
    edges!: Edge<FeedPost>[];

    @Field(type => [FeedPostEdge])
    pageInfo!: Relay.PageInfo;
}

@ObjectType(`FeedPostPage`)
export class FeedPostPage {
    @Field(type => FeedPostConnection)
    page!: FeedPostConnection;

    @Field(type => PageData)
    pageData!: PageData;
}


@ObjectType(`UserEdge`)
export class UserEdge implements Relay.Edge<User> {

    @Field()
    cursor!: Relay.ConnectionCursor;

    @Field(type => User)
    node!: User;

    @Field(type => String)
    cursorDecoded() {
        return Relay.fromGlobalId(this.cursor)
    }
}

@ObjectType(`UserConnection`)
export class UserConnection implements Relay.Connection<User> {
    @Field(type => UserEdge)
    edges!: Edge<User>[];

    @Field(type => [UserEdge])
    pageInfo!: Relay.PageInfo;
}

@ObjectType(`UserPage`)
export class UserPage {
    @Field(type => UserConnection)
    page!: UserConnection;

    @Field(type => PageData)
    pageData!: PageData;
}
