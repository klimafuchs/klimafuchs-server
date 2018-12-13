import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {GameProgressionManager} from "../gameLogic/GameProgressionManager";
import {Container} from "typedi";
import {SeasonInput} from "./types/SeasonInput";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {ChallengeRejection} from "../entity/game-state/ChallengeRejection";
import {SeasonPlanChallenge, UserChallenge} from "../entity/game-state/SeasonPlanChallenge";

@Resolver()
export class GameStateResolver {

    private mgmr: GameProgressionManager = Container.get(GameProgressionManager);

    @Query(returns => Season, {nullable: true})
    async currentSeason(@Ctx() {user}): Promise<Season> {
        return this.mgmr.currentSeason;
    }

    @Query(returns => SeasonPlan, {nullable: true})
    async globalCurrentChallenges(@Ctx() {user}): Promise<SeasonPlan> {
        return this.mgmr.currentSeasonPlan;
    }

    @Query(returns => [UserChallenge], {nullable: true})
    async currentChallenges(@Ctx() {user}): Promise<UserChallenge[]> {
        return this.mgmr.getCurrentChallengesForUser(user);
    }

    @Mutation(returns => ChallengeCompletion, {nullable: true})
    async completeChallenge(@Ctx() {user}, @Arg("challengeId", type => Int) challengeId: number): Promise<ChallengeCompletion> {
        return this.mgmr.completeChallenge(user, challengeId)
    }

    @Mutation(returns => ChallengeRejection, {nullable: true})
        async rejectChallenge(@Ctx() {user}, @Arg("challengeId", type => Int) challengeId: number): Promise<ChallengeRejection> {
        return this.mgmr.rejectChallenge(user, challengeId)
    }
}