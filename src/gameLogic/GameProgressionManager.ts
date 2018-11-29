import {Service} from "typedi";
import {Challenge} from "../entity/wiki-content/Challenge";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {SeasonPlanChallenge} from "../entity/game-state/SeasonPlanChallenge";
import {InjectRepository} from "typeorm-typedi-extensions";
import {EntitySubscriberInterface, EventSubscriber, InsertEvent, LessThan, MoreThan, Repository} from "typeorm";
import {User} from "../entity/user/User";
import * as Schedule from 'node-schedule';
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {ChallengeRejection} from "../entity/game-state/ChallengeRejection";
import {DateUtils} from "typeorm/util/DateUtils";

@Service()
@EventSubscriber()
export class GameProgressionManager implements EntitySubscriberInterface{

    afterUpdate(event: InsertEvent<any>) {
        if(event.entity instanceof Season || event.entity instanceof SeasonPlan) {
            console.log(`BEFORE ENTITY INSERTED: `, event.entity);
            this.init();
        }
    }

    afterInsert(event: InsertEvent<any>) {
        if(event.entity instanceof Season || event.entity instanceof SeasonPlan) {
            console.log(`BEFORE ENTITY INSERTED: `, event.entity);
            this.init();
        }
    }


    public currentSeason: Season;
    public currentSeasonPlan: SeasonPlan;

    private advanceToNextPlanJob;
    private advanceToNextSeasonJob;

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        @InjectRepository(SeasonPlan) private readonly seasonPlanRepository: Repository<SeasonPlan>,
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(SeasonPlanChallenge) private readonly seasonPlanChallengeRepository: Repository<SeasonPlanChallenge>,
        @InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>,
        @InjectRepository(ChallengeRejection) private readonly challengeRejectionRepository: Repository<ChallengeRejection>,
    ) {
        console.log("Starting GameProgressionManager...");
        this.init();
    }

    private init() {
        if (this.advanceToNextSeasonJob) this.advanceToNextSeasonJob.cancel();
        if (this.advanceToNextPlanJob) this.advanceToNextPlanJob.cancel();

        this.findCurrentSeason()
            .then(async season => {
                this.currentSeason = season;
                this.findCurrentSeasonPlan(season)
                    .then(async seasonPlan => {
                        this.currentSeasonPlan = seasonPlan;
                        if (seasonPlan) {
                            const nextSeasonPlanAt = await GameProgressionManager.getAbsoluteEndTimeOfSeasonPlan(this.currentSeason, this.currentSeasonPlan);
                            this.advanceToNextPlanJob = Schedule.scheduleJob(nextSeasonPlanAt, this.advanceToNextPlan.bind(this));
                        } else {
                            // we are in preseason or the season has no seasonPlans yet
                            const nextSeasonPlanAt = season.startOffsetDate.getTime();
                            this.advanceToNextPlanJob = Schedule.scheduleJob(new Date(nextSeasonPlanAt), this.advanceToFirstPlan.bind(this));
                            if (!this.advanceToNextPlanJob) // the seasonoffsetDate
                                throw new Error("Season has no seasonPlans!");
                        }
                        this.advanceToNextSeasonJob = Schedule.scheduleJob(new Date(this.currentSeason.endDate.getTime() + 2000), this.init.bind(this));

                        console.log(`Advancing to next SeasonPlan at ${this.advanceToNextPlanJob.nextInvocation()}. 
                                    \n Advancing to next Season at ${this.advanceToNextSeasonJob.nextInvocation()}`);
                    })
            })
            .catch(err => {
                console.error(err.message)
            });
    }

    static async getAbsoluteEndTimeOfSeasonPlan(season: Season, seasonPlan: SeasonPlan): Promise<Date> {
        let seasonPlans = await season.seasonPlan;

        const idx = seasonPlans.indexOf(seasonPlan);
        if (idx < 0) throw new Error("Illegal argument: seasonPlan is not part of season!");

        const seasonPlansBefore = seasonPlans.slice(0, idx + 1);
        const secsInSeasonPlansBefore = seasonPlansBefore.reduce((acc, cur) => {
            return acc + cur.duration;
        }, 0)

        let millis = season.startOffsetDate.getTime();
        return new Date(millis + secsInSeasonPlansBefore * 1000);
    }

    private async findCurrentSeason(): Promise<Season> {
        let now = new Date(Date.now());
        let nowString = DateUtils.mixedDateToDatetimeString(now);
        let currentSeason = await this.seasonRepository.findOne({
            where: {
                startDate: LessThan(nowString),
                endDate: MoreThan(nowString)
            }
        })
            .catch(err => {
                console.error(err);
                throw Error("No Current Season");
            });
        console.log(currentSeason);
        if (currentSeason == undefined) throw Error("No Current Season");
        return currentSeason;
    }

    private async findCurrentSeasonPlan(season: Season): Promise<SeasonPlan> { //TODO wait for start offset date
        let timeInSeason = (Date.now() - (season.startOffsetDate.getTime())) / 1000;
        if (timeInSeason < 0) {
            // we are in the season startDate - startOffsetDate gap, so no SeasonPlan should be activated.
            // TODO define meaningful pre-season content
            return undefined
        }
        let seasonPlans = await season.seasonPlan;
        return seasonPlans.slice(0).reduce((acc, cur) => { // don't do that to reduce, it has done nothing wrong! :(
            timeInSeason = timeInSeason - cur.duration;
            if (timeInSeason <= 0) {
                return cur;
            }
        }, undefined)
    }

    private advanceToFirstPlan() {
        this.currentSeasonPlan = this.currentSeason.seasonPlan[0]
    }

    private async advanceToNextPlan() {
        let seasonPlans = await this.currentSeason.seasonPlan;

        const nextSeasonPlan = seasonPlans[seasonPlans.indexOf(this.currentSeasonPlan) + 1]
        if (!nextSeasonPlan) {
            console.log("Reached end of SeasonPlans in current Season")
        }
        this.currentSeasonPlan = nextSeasonPlan;
    }

    public async completeChallenge(user: User, seasonPlanChallengeId: number): Promise<ChallengeCompletion> {
        let seasonPlanChallenge: SeasonPlanChallenge = await this.getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId);
        // check the spc exists
        if (!seasonPlanChallenge) return Promise.reject("SeasonPlanChallenge not found in current SeasonPlan!");
        // check that it wasn't rejected
        let challengeRejection: ChallengeRejection = await this.challengeRejectionRepository.findOne(
            {where: {owner: user, seasonPlanChallenge: seasonPlanChallenge}}
        );
        if (challengeRejection) return Promise.reject("SeasonPlanChallenge has previously rejected!");
        // complete challenge
        let challengeCompletion: ChallengeCompletion = new ChallengeCompletion();
        challengeCompletion.owner = Promise.resolve(user);
        challengeCompletion.seasonPlanChallenge = Promise.resolve(seasonPlanChallenge);
        return this.challengeCompletionRepository.save(challengeCompletion);
    }

    public async rejectChallenge(user: User, seasonPlanChallengeId: number): Promise<ChallengeRejection> {
        let seasonPlanChallenge: SeasonPlanChallenge = await this.getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId);
        if (!seasonPlanChallenge) return Promise.reject("SeasonPlanChallenge not found in current SeasonPlan!");
        // TODO check jokers
        let challengeRejection: ChallengeRejection = new ChallengeRejection();
        challengeRejection.owner = Promise.resolve(user);
        challengeRejection.seasonPlanChallenge = Promise.resolve(seasonPlanChallenge);
        return this.challengeCompletionRepository.save(challengeRejection);
    }

    private getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId: number): Promise<SeasonPlanChallenge> {
        return this.currentSeasonPlan.challenges.then(seasonPlanChallenges =>
            seasonPlanChallenges.find(
                sp => sp.id == seasonPlanChallengeId));
    }
}
