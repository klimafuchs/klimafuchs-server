import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ObjectType, Field, Int} from "type-graphql";
import {User} from "./User";
import {FeedComment} from "./FeedComment";

@Entity()
@ObjectType()
export class FeedPost {
    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    title?: string;

    @Field(type => String)
    @Column("longtext")
    body?: string;

    @Field(type => User)
    @ManyToOne(type => User, user => user.posts)
    author: User;

    @Field(type => FeedComment)
    @OneToMany(type => FeedComment, comment => comment.post)
    comments?: FeedComment[];
}