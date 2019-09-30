import {Field, InputType, Int} from "type-graphql";

@InputType()
export class SeasonPlanInput {
    @Field(type => Int, {nullable: true})
    id: number;

    @Field(type => Int, {nullable: true})
    seasonId: number;

    @Field(type => String,{nullable: true})
    themenwocheId: string;

    @Field(type => Int, {nullable: true})
    position: number;

    @Field(type => Int, {nullable: true})
    duration: number;
}