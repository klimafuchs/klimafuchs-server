import {Field, InputType, Int} from "type-graphql";
import {Column, ManyToOne} from "typeorm";
import {FeedPost} from "../../entity/FeedPost";

@InputType()
export class FeedCommentInput {


    @Field(type => String)
    body: string;

    @Field(type => Int)
    parent?: number;

    @Field(type => Int)
    post: number;
}