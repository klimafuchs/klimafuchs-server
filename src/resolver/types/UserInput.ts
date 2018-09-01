import {Field, InputType, Int} from "type-graphql";
import {Media} from "../../entity/Media";

@InputType()
export class UserInput {

    @Field(type => Int)
    id: number;

    @Field(type => String)
    userName: string;

    @Field(type => String)
    screenName: string;

    @Field(type => Boolean)
    emailConfirmed: boolean = false;

    @Field(type => Boolean)
    isBanned: boolean = false;

    @Field(type => String, {nullable: true})
    avatar?: String;

}