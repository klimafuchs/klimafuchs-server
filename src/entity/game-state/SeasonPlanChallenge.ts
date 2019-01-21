import {Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Ctx, Field, Int, ObjectType} from "type-graphql";
import {ChallengeCompletion} from "./ChallengeCompletion";
import {SeasonPlan} from "./SeasonPlan";
import {Challenge} from "../wiki-content/Challenge";
import {ChallengeRejection} from "./ChallengeRejection";
import {IUserChallenge} from "./IUserChallenge";
import {Context} from "../../resolver/types/Context";

@Entity()
@ObjectType({implements: IUserChallenge})
export class SeasonPlanChallenge extends IUserChallenge {

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

    async challengeCompletion(@Ctx() {user}: Context): Promise<ChallengeCompletion> {
        let completions = await this.completions;
        let c = await Promise.all(completions.map(async (c) => {
            let u = await c.owner;
            return {c: c, u: u};
        }));
        completions = c.filter(c => c.u.id === user.id).map(c => c.c);
        if (completions.length > 0) return completions[0];
        return undefined;
    }
}