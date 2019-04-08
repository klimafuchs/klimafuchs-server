import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import {Ctx, Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {FeedPost} from "./FeedPost";
import {Context} from "../../resolver/types/Context";

@Entity()
@ObjectType()
export class FeedComment {
    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String, {nullable: true})
    @Column()
    body?: string;

    @Field(type => Date)
    @CreateDateColumn()
    dateCreated: Date;

    @Field(type => Int)
    @Column()
    sentiment: number = 0;

    @Field(type => User)
    @ManyToOne(type => User, user => user.posts)
    author: Promise<User>;

    @Field(type => FeedPost)
    @ManyToOne(type => FeedPost, post => post.comments)
    post: Promise<FeedPost>;

    @Field(type => FeedComment, {nullable: true})
    @ManyToOne(type => FeedComment, comment => comment.children)
    parent?: Promise<FeedComment>;

    @Field(type => [FeedComment], {nullable: true})
    @OneToMany(type => FeedComment, comment => comment.parent)
    children?: Promise<FeedComment[]>;

    @ManyToMany(type => User, {nullable: true})
    @JoinTable()
    likedBy?: Promise<User[]>;

    @Field(type => Boolean)
    async currentUserLikesComment(@Ctx() {user}: Context): Promise<boolean> {
        return this.likedBy.then((users) => users.some((u) => u.id === user.id));
    }
}