import {Arg, Authorized, Ctx, Int, Mutation, Query, Resolver} from "type-graphql"
import {getCustomRepository, getRepository, Repository} from "typeorm";
import {FeedPost} from "../entity/social/FeedPost";
import {InjectRepository} from "typeorm-typedi-extensions";
import {FeedComment} from "../entity/social/FeedComment";
import {FeedPostInput} from "./types/FeedPostInput";
import {Context} from "./types/Context";
import {FeedCommentInput} from "./types/FeedCommentInput";
import {connectionTypes} from "./types/ConnectionTypes";
import {PaginatingRepository} from "./PaginatingRepository";
import {ConnectionArgs} from "./types/ConnectionPaging";
import {connectionArgs} from "graphql-relay";
import {getCurves} from "crypto";

@Resolver()
export class FeedPostResolver {

    constructor(
        @InjectRepository(FeedPost) private readonly feedPostRepository: Repository<FeedPost>,
        @InjectRepository(FeedComment) private readonly feedCommentRepository: Repository<FeedComment>,
    ) {
    }

    @Query(returns => FeedPost, {nullable: true})
    post(@Arg("postId", type => Int) postId: number): Promise<FeedPost> {
        return this.feedPostRepository.findOne(postId);
    }

    @Query(returns => [FeedPost])
    async posts(): Promise<FeedPost[]> {
        const posts= await this.feedPostRepository.find();
        return posts;
    }

    @Query(returns => connectionTypes("PaginatedFeed", FeedPost))
    async paginatedPosts(@Arg("connectionArgs", type => ConnectionArgs) connectionArgs: ConnectionArgs) {
        const paginatingRepo = getRepository( "PaginatingRepository<FeedPost>");
        return paginatingRepo.findAndPaginate({}, connectionArgs);

    }

    @Query(returns => [FeedComment], {nullable: true})
    commentsOfPost(@Arg("postId", type => Int) postId: number): Promise<FeedComment[]> {
        return this.feedCommentRepository.find({
            relations: ["post"],
            where: {
                post: {
                    id: postId
                }
            }
        })
    }

    @Mutation(returns => FeedPost)
    async addPost(@Arg("post") postInput: FeedPostInput, @Ctx() {user}: Context): Promise<FeedPost> {
        let post = new FeedPost();
        post.author = Promise.resolve(user);
        Object.assign(post, postInput)
        return this.feedPostRepository.save(post);
    }

    @Mutation(returns => Boolean)
    async removeOwnPost(@Arg("postId", type => Int) postId: number, @Ctx() {user}: Context): Promise<Boolean> {
        const post = await this.feedPostRepository.findOne(postId);
        if((await post.author).id === user.id) {
            await this.feedPostRepository.remove(post);
            return true;
        } else {
            return false;
        }
    }

    @Authorized("ADMIN")
    @Mutation(returns => FeedPost)
    async removePost(@Arg("postId", type => Int) postId: number): Promise<FeedPost> {
        let post = await this.feedPostRepository.findOne(postId);
        post = await this.feedPostRepository.remove(post);
        return post;
    }

    @Mutation(returns => Boolean)
    async removeOwnComment(@Arg("CommentId", type => Int) commentId: number, @Ctx() {user}: Context): Promise<Boolean> {
        const comment = await this.feedCommentRepository.findOne(commentId);
        if((await comment.author).id === user.id) {
            await this.feedCommentRepository.remove(comment);
            return true;
        } else {
            return false;
        }
    }

    @Authorized("ADMIN")
    @Mutation(returns => FeedComment)
    async removeComment(@Arg("CommentId", type => Int) commentId: number): Promise<FeedComment> {
        const comment = await this.feedCommentRepository.findOne(commentId);
        return this.feedCommentRepository.remove(comment);
    }



    @Mutation(returns => FeedComment)
    async addComment(@Arg("comment") commentInput: FeedCommentInput, @Ctx() {user}: Context): Promise<FeedComment> {
        const post = await this.feedPostRepository.findOne({
            where: {
                id: commentInput.post
            }
        });

        if (!post) {
            throw new Error("Invalid post ID");
        }

        let comment = new FeedComment();

        if (commentInput.parent !== undefined) { // explicitly check if value is not null, otherwise if cast falsy values even if present
            const parent = await this.feedCommentRepository.findOne({
                where: {
                    id: commentInput.parent
                }
            });

            if (!parent) {
                throw new Error("Invalid parent ID");
            }
            comment.parent = Promise.resolve(parent);
        }
        comment.body =  commentInput.body;
        comment.post = Promise.resolve(post);
        comment.author = Promise.resolve(user);
        return this.feedCommentRepository.save(comment);

    }
}