import {CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {ObjectType} from "type-graphql";
import {User} from "../user/User";
import {SeasonPlan} from "./SeasonPlan";
import {Challenge} from "../wiki-content/Challenge";
import {SeasonPlanChallenge} from "./SeasonPlanChallenge";

@Entity()
@ObjectType()
export class SeasonPlanChallenges {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(type => User, u => u.challengeCompletions)
    owner: User;

    @ManyToOne(type => SeasonPlan)
    seasonPlan: SeasonPlan;

    challenges: SeasonPlanChallenge[]

}