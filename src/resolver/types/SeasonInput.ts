import {Field, InputType, Int} from "type-graphql";

@InputType()
export class SeasonInput {
    @Field(type => Int, {nullable: true})
    id: number;

    @Field(type => Date, {nullable: true})
    startDate: Date;

    @Field(type => Date, {nullable: true})
    endDate: Date;

    @Field(type => String, {nullable: true})
    title: string;
}