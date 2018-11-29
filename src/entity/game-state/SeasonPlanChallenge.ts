import {Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {ChallengeCompletion} from "./ChallengeCompletion";
import {SeasonPlan} from "./SeasonPlan";
import {Challenge} from "../wiki-content/Challenge";

@Entity()
@ObjectType()
export class SeasonPlanChallenge {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => ChallengeCompletion)
    @OneToMany(type => ChallengeCompletion, c => c.seasonPlanChallenge)
    completions: Promise<ChallengeCompletion[]>;

    @Field(type => SeasonPlan)
    @ManyToOne(type => SeasonPlan)
    plan: Promise<SeasonPlan>;

    @Field(type => Challenge)
    @ManyToOne(type => Challenge)
    challenge: Promise<Challenge>;

}