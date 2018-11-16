import {Arg, Authorized, Ctx, Int, Mutation, Query, Resolver} from "type-graphql"
import {Repository} from "typeorm";
import {FeedPost} from "../entity/social/FeedPost";
import {InjectRepository} from "typeorm-typedi-extensions";
import {FeedComment} from "../entity/social/FeedComment";
import {FeedPostInput} from "./types/FeedPostInput";
import {Context} from "./types/Context";
import {FeedCommentInput} from "./types/FeedCommentInput";

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
    addPost(@Arg("post") postInput: FeedPostInput, @Ctx() {user}: Context): Promise<FeedPost> {
        const post = this.feedPostRepository.create({
            ...postInput,
            author: user,
        });
        return this.feedPostRepository.save(post);
    }

    @Mutation(returns => Boolean)
    async removeOwnPost(@Arg("postId", type => Int) postId: number, @Ctx() {user}: Context): Promise<Boolean> {
        const post = await this.feedPostRepository.findOne(postId);
        if(post.author.id === user.id) {
            await this.feedPostRepository.remove(post);
            return true;
        } else {
            return false;
        }
    }

    @Authorized("ADMIN")
    @Mutation(returns => FeedPost)
    async removePost(@Arg("postId", type => Int) postId: number): Promise<FeedPost> {
        const post = await this.feedPostRepository.findOne(postId);
        return this.feedPostRepository.remove(post);
    }

    @Mutation(returns => Boolean)
    async removeOwnComment(@Arg("CommentId", type => Int) commentId: number, @Ctx() {user}: Context): Promise<Boolean> {
        const comment = await this.feedCommentRepository.findOne(commentId);
        if(comment.author.id === user.id) {
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
    async addComment(@Arg("post") commentInput: FeedCommentInput, @Ctx() {user}: Context): Promise<FeedComment> {
        const post = await this.feedPostRepository.findOne({
            where: {
                id: commentInput.post
            }
        });

        if (!post) {
            throw new Error("Invalid post ID");
        }

        if (commentInput.parent !== undefined) { // explicitly check if value is not null, otherwise if cast falsy values even if present
            const parent = await this.feedCommentRepository.findOne({
                where: {
                    id: commentInput.parent
                }
            })

            if (!parent) {
                throw new Error("Invalid parent ID");
            }

            const comment = this.feedCommentRepository.create({
                body: commentInput.body,
                post: post,
                parent: parent,
                author: user,
            });
            return this.feedCommentRepository.save(comment);

        } else {
            const comment = this.feedCommentRepository.create({
                body: commentInput.body,
                post: post,
                author: user,
            });
            return this.feedCommentRepository.save(comment);
        }
    }
}