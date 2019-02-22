import {Container, Service} from "typedi";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {subscribe} from "../util/EventUtil";
import {Membership} from "../entity/social/Membership";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";

// TODO this has no right to be a class, but @subscribe can only annotate methods because
//  typescript is terrible. Might as well make it a service then.
@Service()
export class LeaderBoardManager {

    @InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>;
    @InjectRepository(Membership) private readonly membershipRepository: Repository<Membership>;

    @subscribe(ChallengeCompletion)
    public static async addScoreToTeams(_challengeCompletion: ChallengeCompletion, action: string) {
        console.log(_challengeCompletion);
        let challengeCompletion: ChallengeCompletion = await Container.get(LeaderBoardManager).challengeCompletionRepository.findOne(_challengeCompletion.id);
        console.log(challengeCompletion);

        const owner = await challengeCompletion.owner;
        const memberships = await owner.memberships;
        const points = (await (await challengeCompletion.seasonPlanChallenge).challenge).score;
        console.log(`ChallengeCompletion mod for ${owner.screenName}, action ${action}, score value ${points}`);

        memberships.map(async membership => {
            if(membership.isActive) {
                let team = await membership.team;
                console.log(`Updating score on ${team.name}`);
                team.addScore(points)
            }
        });
    }

    @subscribe(Membership)
    public static async updateTeamSize(membership: Membership, action: string) {
        let team = await (await Container.get(LeaderBoardManager).membershipRepository.findOne(membership.id)).team;
        console.log(`Updating team size on ${team.name}`);
        team.updateTeamSize(action).catch(err => console.error(err));
    }
}
