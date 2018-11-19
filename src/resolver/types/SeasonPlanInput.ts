import {Field, InputType, Int} from "type-graphql";

@InputType()
export class SeasonPlanInput {
    @Field(type => Int, {nullable: true})
    id: number;

    @Field(type => Int)
    seasonId: number;

    @Field(type => String)
    themenwocheTitle: string;

    @Field(type => Date)
    startDate: Date;

    @Field(type => Int, {nullable: true})
    duration: number;
}