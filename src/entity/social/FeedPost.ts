import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ObjectType, Field, Int} from "type-graphql";
import {User} from "../user/User";
import {FeedComment} from "./FeedComment";

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

    @Field(type => FeedComment, {nullable: true})
    @OneToMany(type => FeedComment, comment => comment.post, {nullable: true})
    comments?: Promise<FeedComment[]>;
}