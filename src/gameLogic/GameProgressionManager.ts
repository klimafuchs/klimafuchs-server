import {Service} from "typedi";
import {Challenge} from "../entity/wiki-content/Challenge";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {SeasonPlanChallenge} from "../entity/game-state/SeasonPlanChallenge";
import {InjectRepository} from "typeorm-typedi-extensions";
import {EntitySubscriberInterface, EventSubscriber, In, InsertEvent, LessThan, MoreThan, Repository} from "typeorm";
import {User} from "../entity/user/User";
import * as Schedule from 'node-schedule';
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {ChallengeRejection} from "../entity/game-state/ChallengeRejection";
import {DateUtils} from "typeorm/util/DateUtils";
import {ChallengeReplacement} from "../entity/game-state/ChallengeReplacement";
import {IUserChallenge} from "../entity/game-state/IUserChallenge";

@Service()
@EventSubscriber()
export class GameProgressionManager implements EntitySubscriberInterface{

    // Subscribing to updates to Season and SeasonPlan provides a way to reinitialize the game state if new seasons are added.
    // This is useful in testing to be able to insert a new _current_ season and making it the currentSeason without restarting the server.
    // In production, this could be used to fix errors in the current season and immediately reflect these changes in the app.
    afterUpdate(event: InsertEvent<any>) {
        if(event.entity instanceof Season || event.entity instanceof SeasonPlan) {
            console.log(`BEFORE ENTITY INSERTED: `, event.entity);
            this.setUpCurrentSeason();
        }
    }

    afterInsert(event: InsertEvent<any>) {
        if(event.entity instanceof Season || event.entity instanceof SeasonPlan) {
            console.log(`BEFORE ENTITY INSERTED: `, event.entity);
            this.setUpCurrentSeason();
        }
    }

    private _currentSeason: Season;
    private _currentSeasonPlan: SeasonPlan;

    get currentSeason(): Season {
        return this._currentSeason;
    }

    get currentSeasonPlan(): SeasonPlan {
        return this._currentSeasonPlan;
    }

    private advanceToNextPlanJob;
    private advanceToNextSeasonJob;

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        @InjectRepository(SeasonPlan) private readonly seasonPlanRepository: Repository<SeasonPlan>,
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(SeasonPlanChallenge) private readonly seasonPlanChallengeRepository: Repository<SeasonPlanChallenge>,
        @InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>,
        @InjectRepository(ChallengeRejection) private readonly challengeRejectionRepository: Repository<ChallengeRejection>,
        @InjectRepository(ChallengeReplacement) private readonly challengeReplacementRepository: Repository<ChallengeReplacement>,
    ) {
        console.log("Starting GameProgressionManager...");
        this.setUpCurrentSeason();
    }

    public setUpCurrentSeason() {
        if (this.advanceToNextSeasonJob) this.advanceToNextSeasonJob.cancel();
        if (this.advanceToNextPlanJob) this.advanceToNextPlanJob.cancel();

        this.findCurrentSeason()
            .then(async season => {
                this._currentSeason = season;
                this.findCurrentSeasonPlan(season)
                    .then(async seasonPlan => {
                        this._currentSeasonPlan = seasonPlan;
                        if (seasonPlan) {
                            const nextSeasonPlanAt = await GameProgressionManager.getAbsoluteEndTimeOfSeasonPlan(this._currentSeason, this._currentSeasonPlan);
                            this.advanceToNextPlanJob = Schedule.scheduleJob(nextSeasonPlanAt, this.advanceToNextPlan.bind(this));
                        } else {
                            // we are in preseason or the season has no seasonPlans yet
                            const nextSeasonPlanAt = season.startOffsetDate.getTime();
                            this.advanceToNextPlanJob = Schedule.scheduleJob(new Date(nextSeasonPlanAt), this.advanceToFirstPlan.bind(this));
                            if (!this.advanceToNextPlanJob) // the seasonoffsetDate
                                throw new Error("Season has no seasonPlans!");
                        }
                        this.advanceToNextSeasonJob = Schedule.scheduleJob(new Date(this._currentSeason.endDate.getTime() + 2000), this.setUpCurrentSeason.bind(this));

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
        this._currentSeasonPlan = this._currentSeason.seasonPlan[0]
    }

    private async advanceToNextPlan() {
        let seasonPlans = await this._currentSeason.seasonPlan;

        const nextSeasonPlan = seasonPlans[seasonPlans.indexOf(this._currentSeasonPlan) + 1]
        if (!nextSeasonPlan) {
            console.log("Reached end of SeasonPlans in current Season")
        }
        this._currentSeasonPlan = nextSeasonPlan;
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
        // check if the challenge was alreacy completed
        let existingChallengeCompletion: ChallengeCompletion = await this.challengeCompletionRepository.findOne({
            where: {
                owner: {id: user.id},
                seasonPlanChallenge: seasonPlanChallenge
            }
        });
        console.log(existingChallengeCompletion);
        if (existingChallengeCompletion) return existingChallengeCompletion;
        // complete challenge
        let challengeCompletion: ChallengeCompletion = new ChallengeCompletion();
        challengeCompletion.owner = Promise.resolve(user);
        challengeCompletion.seasonPlanChallenge = Promise.resolve(seasonPlanChallenge);
        return this.challengeCompletionRepository.save(challengeCompletion);
    }

    public async rejectChallenge(user: User, seasonPlanChallengeId: number): Promise<ChallengeRejection> {
        let seasonPlanChallenge: SeasonPlanChallenge = await this.getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId);
        if (!seasonPlanChallenge) return Promise.reject("SeasonPlanChallenge not found in current SeasonPlan!");
        const userRejections = await this.challengeRejectionRepository.find({where: {owner: user, seasonPlanChallenge: seasonPlanChallenge}});
        if(userRejections && userRejections.length > 0) {
            return Promise.reject("SeasonPlanChallenge already rejected!");
        }
        // TODO check jokers
        let challengeRejection: ChallengeRejection = new ChallengeRejection();
        challengeRejection.owner = Promise.resolve(user);
        challengeRejection.seasonPlanChallenge = Promise.resolve(seasonPlanChallenge);

        await this.addReplacementChallenge(user, this.currentSeasonPlan, challengeRejection)
            .catch(err => {
                return Promise.reject(err)
            });

        return this.challengeRejectionRepository.save(challengeRejection)
    }

    public async getCurrentChallengesForUser(user: User): Promise<IUserChallenge[]> {
        let challenges: IUserChallenge[] = await this.currentSeasonPlan.challenges;
        const replacements: IUserChallenge[] = await this.challengeReplacementRepository.find({
            where: {
                owner: user,
                seasonPlan: this.currentSeasonPlan
            }
        });
        challenges = challenges.concat(replacements);

        console.log(await challenges.map(challenge => challenge.challenge.then(async c => await c.themenWoche)));

        const rejections = await this.challengeRejectionRepository.find({
            where: {
                owner: user,
                seasonPlanChallenge: {id: In(challenges.map(ch => ch.id))}
            }
        });

        if(rejections &&rejections.length > 0){
            const rejectionPlanIds = await Promise.all(rejections.map(async rejection => {
                return {rejection, id: await rejection.seasonPlanChallenge.then(_ => _.id)}
            }));

            const nonRejectedChallenges = challenges.filter(challenge => {
                return rejectionPlanIds.some(rejectionPlanId => rejectionPlanId.id !== challenge.id);
            });

            return nonRejectedChallenges;
        } else {
            return challenges;
        }

    }

    private async addReplacementChallenge(user: User, currentSeasonPlan: SeasonPlan, newRejection?: ChallengeRejection): Promise<ChallengeReplacement> {

        let challengeReplacement = new ChallengeReplacement();
        challengeReplacement.owner = Promise.resolve(user);
        challengeReplacement.plan = Promise.resolve(currentSeasonPlan);

        const rejections = await user.challengeRejections;
        if(newRejection) rejections.push(newRejection);
        const rejectedChallenges = await Promise.all(rejections.map(async rejection => {
            return await rejection.seasonPlanChallenge;
        }));

        // select replacement challenge by searching the oberthema and then te kategorie. Error out if no more challenges are available;
        let replacementChallenge: Challenge;
        const themenwoche = await currentSeasonPlan.themenwoche;
        const oberthemaChallenges = await themenwoche.oberthema.then(async value => await value.challenges);
        const availableOberthemaChallenges = oberthemaChallenges.filter(challenge => this.filterRejections(challenge, rejections, this.currentSeasonPlan));
        if(availableOberthemaChallenges && availableOberthemaChallenges.length > 0) {
            replacementChallenge = availableOberthemaChallenges[0];
        } else {
            const kategorieChallenges = await themenwoche.kategorie.then(async value => await value.challenges);
            const availableKategorieChallenges = kategorieChallenges.filter(challenge => this.filterRejections(challenge,rejections, this.currentSeasonPlan));
            if(availableKategorieChallenges && availableKategorieChallenges.length > 0) {
                replacementChallenge = availableKategorieChallenges[0];
            } else {
                return Promise.reject("No additional challenges in oberthema or katergorie!");
            }
        }

        challengeReplacement.challenge = Promise.resolve(replacementChallenge);

        return this.challengeReplacementRepository.save(challengeReplacement);
    }

    private async filterRejections(challenge: Challenge, rejections: ChallengeRejection[], currentSeasonPlan: SeasonPlan): Promise<boolean> {
        const r = rejections.filter( async rejection => {
            let seasonPlanChallenge = await rejection.seasonPlanChallenge.then(async spc => await spc.challenge);
            return challenge.id === seasonPlanChallenge.id;
        });
        const currentSeasonPlanChallenges = await currentSeasonPlan.challenges;
        const s = currentSeasonPlanChallenges.filter(async spc => {
            let seasonPlanChallenge = await spc.challenge;
            return challenge.id === seasonPlanChallenge.id;
        });
        return !(r.length + s.length);
    }

    private getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId: number): Promise<SeasonPlanChallenge> {
        return this._currentSeasonPlan.challenges.then(seasonPlanChallenges =>
            seasonPlanChallenges.find(
                sp => sp.id == seasonPlanChallengeId));
    }
}
