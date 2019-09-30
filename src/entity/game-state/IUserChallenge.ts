import {Field, Int, InterfaceType} from "type-graphql";
import {Challenge} from "../wiki-content/Challenge";
import {SeasonPlan} from "./SeasonPlan";
import {ChallengeCompletion} from "./ChallengeCompletion";
import {Context} from "../../resolver/types/Context";

@InterfaceType()
export abstract class IUserChallenge {

    @Field(type => Challenge)
    challenge: Promise<Challenge>;

    @Field(type => Int)
    id: number;

    @Field(type => SeasonPlan)
    plan: Promise<SeasonPlan>;

    @Field(type => Boolean, {nullable: true})
    replaceable: Boolean = true;

    @Field(type => ChallengeCompletion, {nullable: true})
    async challengeCompletion({user}: Context): Promise<ChallengeCompletion> {
        console.error("dont call this");
        return undefined
    };
}