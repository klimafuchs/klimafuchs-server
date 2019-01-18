import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {FeedPost} from "./FeedPost";

@Entity()
@ObjectType()
export class FeedComment {
    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String, {nullable: true})
    @Column("longtext")
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

    @Field(type => [FeedComment], {nullable: true})
    @ManyToOne(type => FeedComment, comment => comment.children)
    parent?: Promise<FeedComment>;

    @Field(type => [FeedComment], {nullable: true})
    @OneToMany(type => FeedComment, comment => comment.parent)
    children?: Promise<FeedComment[]>;

}