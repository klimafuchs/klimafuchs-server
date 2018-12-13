import {Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Field, Int, InterfaceType, ObjectType} from "type-graphql";
import {ChallengeCompletion} from "./ChallengeCompletion";
import {SeasonPlan} from "./SeasonPlan";
import {Challenge} from "../wiki-content/Challenge";
import {ChallengeRejection} from "./ChallengeRejection";
import {ChallengeReplacement} from "./ChallengeReplacement";

@InterfaceType()
export abstract class UserChallenge {

    @Field(type => Challenge)
    challenge: Promise<Challenge>;

    @Field(type => Int)
    id: number;

    @Field(type => SeasonPlan)
    plan: Promise<SeasonPlan>;
}

@Entity()
@ObjectType({implements: UserChallenge})
export class SeasonPlanChallenge implements UserChallenge {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => ChallengeCompletion)
    @OneToMany(type => ChallengeCompletion, c => c.seasonPlanChallenge)
    completions: Promise<ChallengeCompletion[]>;

    @Field(type => ChallengeRejection)
    @OneToMany(type => ChallengeRejection, c => c.seasonPlanChallenge)
    rejections: Promise<ChallengeRejection[]>;

    @Field(type => SeasonPlan)
    @ManyToOne(type => SeasonPlan, { onDelete: 'SET NULL' })
    plan: Promise<SeasonPlan>;

    @Field(type => Challenge)
    @ManyToOne(type => Challenge,{ onDelete: 'SET NULL' })
    challenge: Promise<Challenge>;

}