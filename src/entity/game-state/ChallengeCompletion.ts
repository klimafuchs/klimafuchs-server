import {CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {SeasonPlanChallenge} from "./SeasonPlanChallenge";
import {ChallengeReplacement} from "./ChallengeReplacement";

@Entity()
@ObjectType()
export class ChallengeCompletion {

    @Field(type => Int, {nullable: true})
    @PrimaryGeneratedColumn()
    id?: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => User)
    @ManyToOne(type => User, u => u.challengeCompletions)
    owner: Promise<User>;

    @Field(type => SeasonPlanChallenge, {nullable: true})
    @ManyToOne(type => SeasonPlanChallenge, s => s.completions, {nullable: true})
    seasonPlanChallenge: Promise<SeasonPlanChallenge>;

    @Field(type => ChallengeReplacement, {nullable: true})
    @OneToOne(type => ChallengeReplacement, s => s.completion, {nullable: true})
    replacementChallenge: Promise<ChallengeReplacement>

}