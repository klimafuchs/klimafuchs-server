import {Arg, Authorized, Ctx, Int, Mutation, Query, Resolver} from "type-graphql"
import {getCustomRepository, Repository} from "typeorm";
import {FeedPost} from "../entity/social/FeedPost";
import {InjectRepository} from "typeorm-typedi-extensions";
import {FeedComment} from "../entity/social/FeedComment";
import {FeedPostInput} from "./types/FeedPostInput";
import {Context} from "./types/Context";
import {FeedCommentInput} from "./types/FeedCommentInput";
import {Role} from "../entity/user/User";
import {FeedPostPage, PaginatingFeedPostRepository} from "./PaginatingRepository";
import {ConnectionArgs} from "./types/ConnectionPaging";
import {Media} from "../entity/Media";

@Resolver()
export class FeedPostResolver {

    constructor(
        @InjectRepository(FeedPost) private readonly feedPostRepository: Repository<FeedPost>,
        @InjectRepository(FeedComment) private readonly feedCommentRepository: Repository<FeedComment>,
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>
    ) {
    }

    @Query(returns => FeedPost, {nullable: true})
    async post(@Arg("postId", type => Int) postId: number, @Ctx() {user}: Context): Promise<FeedPost> {
        let post = await this.feedPostRepository.findOne(postId);
        await post.currentUserLikesPost(user);
        return post;
    }

    @Query(returns => [FeedPost])
    async posts(@Ctx() {user}: Context): Promise<FeedPost[]> {
        const posts = await this.feedPostRepository.find();
        await Promise.all(posts.map((post) => post.currentUserLikesPost(user)));
        return posts;
    }

    @Query(returns => FeedPostPage)
    async paginatedPosts(@Arg("connectionArgs", type => ConnectionArgs) connectionArgs: ConnectionArgs, @Ctx() {user}: Context) {
        const paginatingRepo = getCustomRepository(PaginatingFeedPostRepository);
        let page = await paginatingRepo.findAndPaginate({}, {dateCreated: "DESC"}, connectionArgs);
        await Promise.all(page.page.edges.map((edge) => edge.node.currentUserLikesPost(user)));
        return page;
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
    async likePost(@Arg("postId", type => Int) postId: number, @Ctx() {user}: Context): Promise<FeedPost> {

        let post = await this.feedPostRepository.findOne(postId);
        if (!post) return undefined;

        // return post as is if the context user already liked the post
        await post.currentUserLikesPost(user);
        if (post.currentUserLikedPost) {
            return post;
        }
        let postLikedBy = await post.likedBy;

        postLikedBy.push(user);
        post.likedBy = Promise.resolve(postLikedBy);
        post.sentiment = postLikedBy.length;
        post = await this.feedPostRepository.save(post);
        post.currentUserLikedPost = true;
        return post;
    }

    @Mutation(returns => FeedPost)
    async unlikePost(@Arg("postId", type => Int) postId: number, @Ctx() {user}: Context): Promise<FeedPost> {

        let post = await this.feedPostRepository.findOne(postId);
        if (!post) return undefined;

        await post.currentUserLikesPost(user);
        if (!post.currentUserLikedPost) {
            return post;
        }

        let postLikedBy = await post.likedBy;
        postLikedBy = postLikedBy.filter(u => u.id !== user.id);
        post.likedBy = Promise.resolve(postLikedBy);
        post.sentiment = postLikedBy.length;
        post = await this.feedPostRepository.save(post);
        post.currentUserLikedPost = false;
        return post;
    }

    @Mutation(returns => FeedPost)
    async addPost(@Arg("post") postInput: FeedPostInput, @Ctx() {user}: Context): Promise<FeedPost> {
        let post = new FeedPost();
        post.author = Promise.resolve(user);
        post.title = postInput.title;
        post.body = postInput.body;
        post.isPinned = postInput.isPinned;
        if (postInput.ytId) post.ytId = postInput.ytId;
        if (postInput.mediaId) {
            const media = await this.mediaRepository.findOne(postInput.mediaId);
            if (media) {
                post.image = Promise.resolve(media);
            }
        }
        if(user.role !== Role.Admin) {
            post.isPinned = false;
        }
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
            this.feedCommentRepository.remove(comment)
                .then(() => true)
                .catch((err) => Promise.reject(err));
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