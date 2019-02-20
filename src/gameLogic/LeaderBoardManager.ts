import {Service} from "typedi";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {subscribe} from "../util/EventUtil";

// TODO this has no right to be a class, but @subscribe can only annotate methods because
//  typescript is terrible. Might as well make it a service then.
@Service()
export class LeaderBoardManager {
    @subscribe(ChallengeCompletion)
    public static async addScoreToTeams(challengeCompletion: ChallengeCompletion, action: string) {
        const owner = await challengeCompletion.owner;
        const memberships = await owner.memberships;
        const points = (await (await challengeCompletion.seasonPlanChallenge).challenge).score

        memberships.map(async membership => {
            if(membership.isActive) {
                let team = await membership.team;
                team.addScore(points)
            }
        });
    }
}