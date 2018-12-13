import {CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {UserChallenge} from "./SeasonPlanChallenge";
import {SeasonPlan} from "./SeasonPlan";
import {Challenge} from "../wiki-content/Challenge";

@Entity()
@ObjectType({implements: UserChallenge})
export class ChallengeReplacement implements UserChallenge {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => User)
    @ManyToOne(type => User, u => u.challengeReplacements)
    owner: Promise<User>;

    @Field(type => Challenge)
    @ManyToOne(type => Challenge)
    challenge: Promise<Challenge>;

    @Field(type => SeasonPlan)
    @ManyToOne(type => SeasonPlan)
    plan: Promise<SeasonPlan>;


}