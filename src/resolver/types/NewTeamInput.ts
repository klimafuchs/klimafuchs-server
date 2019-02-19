import {Field, InputType, Int} from "type-graphql";

@InputType()
export class NewTeamInput {

    @Field(type => String!)
    teamName: string;

    @Field(type => Int, {nullable: true})
    mediaId?: number;

}