import {Field, InputType, Int} from "type-graphql";

@InputType()
export class FeedPostInput {

    @Field(type => String)
    title: string;

    @Field(type => String)
    body: string;

    @Field(type => Boolean, {nullable: true})
    isPinned?: boolean = false;

    @Field(type => Int, {nullable: true})
    mediaId?: number;

    @Field(type => String, {nullable: true})
    ytId?: string;

}