import {Field, InputType, Int} from "type-graphql";

@InputType()
export class TeamInput {

    @Field(type => Int, {nullable: true})
    id: number;

    @Field(type => String, {nullable: true})
    teamName: string;

    @Field(type => String, {nullable: true})
    teamDescription: string;

    @Field(type => Int, {nullable: true})
    mediaId?: number;

}