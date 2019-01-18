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
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {FeedComment} from "./FeedComment";
import {Media} from "../Media";

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

    @Field(type => Boolean)
    currentUserLikedPost: boolean = false;

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

    public async currentUserLikesPost(user: User) {
        let likes = await this.likedBy;
        this.currentUserLikedPost = (likes && likes.filter(u => u.id === user.id).length > 0);
    }

    public async updateCommentCount() {
        const comments = await this.comments;
        console.log(comments);
        this.commentCount = comments.length;
        return getRepository(FeedPost).save(this);
    }
}