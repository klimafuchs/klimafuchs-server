import {
    Column,
    CreateDateColumn,
    Entity,
    getRepository,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import {Ctx, Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {FeedComment} from "./FeedComment";
import {Media} from "../Media";
import {Context} from "../../resolver/types/Context";
import {subscribe} from "../../util/EventUtil";
import {getArrayFromOverloadedRest} from "type-graphql/helpers/decorators";

@Entity()
@ObjectType()
export class FeedPost {
    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String, {nullable: true})
    @Column()
    title?: string;

    @Field(type => String, {nullable: true})
    @Column("longtext")
    body?: string;

    @Field(type => Date)
    @CreateDateColumn()
    dateCreated: Date;

    @Field(type => User)
    @ManyToOne(type => User, user => user.posts)
    author: Promise<User>;

    @Field(type => [FeedComment], {nullable: true})
    @OneToMany(type => FeedComment, comment => comment.post, {nullable: true})
    comments?: Promise<FeedComment[]>;

    @Field(type => Boolean)
    @Column({default: false})
    isPinned!: boolean;

    @Field(type => Int)
    @Column({default: 0})
    sentiment: number;

    @ManyToMany(type => User, {nullable: true})
    @JoinTable()
    likedBy?: Promise<User[]>;

    // Only one of image or ytId should be set
    // TODO move to their own Entity to preserve NF

    @Field(type => Media, {nullable: true})
    @ManyToOne(type => Media, {nullable: true})
    image?: Promise<Media>;

    @Field(type => String, {nullable: true})
    @Column({nullable: true})
    ytId?: string;

    @Field(type => Int)
    @Column({default: 0})
    commentCount: number;

    @Field(type => Boolean)
    async currentUserLikesPost(@Ctx() {user}: Context): Promise<boolean> {
        return this.likedBy.then((users) => users.some((u) => u.id === user.id));
    }

    @subscribe(FeedPost)
    public static async updateCommentCountForPost(post: FeedPost) {
        (await getRepository(FeedPost).preload(post))
            .updateCommentCount()
            .catch(err =>console.error(err));
    }

    public async updateCommentCount() {
        const comments = await this.comments;
        console.log(comments);
        this.commentCount = comments.length;
        return getRepository(FeedPost).save(this);
    }
}