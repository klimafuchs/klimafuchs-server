import {Field, InputType, Int} from "type-graphql";
import {Media} from "../../entity/Media";

@InputType()
export class UserInput {

    @Field(type => Int)
    id: number;

    @Field(type => String, {nullable: true})
    userName?: string;

    @Field(type => String, {nullable: true})
    screenName?: string;

    @Field(type => Boolean, {nullable: true})
    emailConfirmed?: boolean; // TODO send bools as string for reasons

    @Field(type => Boolean, {nullable: true})
    isBanned?: boolean;

    @Field(type => String, {nullable: true})
    avatar?: String;

}