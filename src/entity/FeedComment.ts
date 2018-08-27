import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ObjectType, Field, Int} from "type-graphql";
import {User} from "./User";
import {FeedPost} from "./FeedPost";

@Entity()
@ObjectType()
export class FeedComment {
    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column("longtext")
    body?: string;


    @Field(type => Int)
    @Column()
    sentiment: number = 0;

    @Field(type => User)
    @ManyToOne(type => User, user => user.posts)
    author: User;

    @Field(type => FeedPost)
    @ManyToOne(type => FeedPost, post => post.comments)
    post: FeedPost;

    @Field(type => FeedComment)
    @ManyToOne(type => FeedComment, comment => comment.children)
    parent?: FeedComment;

    @Field(type => FeedComment)
    @OneToMany(type => FeedComment, comment => comment.parent)
    children?: FeedComment[];
}