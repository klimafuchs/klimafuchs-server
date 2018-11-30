import {Arg, Authorized, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import {Oberthema} from "../entity/wiki-content/Oberthema";
import {Challenge} from "../entity/wiki-content/Challenge";
import {Quelle} from "../entity/wiki-content/Quelle";
import {WikiImage} from "../entity/wiki-content/WikiImage";
import {Themenwoche} from "../entity/wiki-content/Themenwoche";
import {WikiWarning} from "../entity/wiki-content/WikiWarning";
import {Kategorie} from "../entity/wiki-content/Kategorie";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";
import {Props} from "../entity/wiki-content/Props";
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {SeasonPlanInput} from "./types/SeasonPlanInput";
import {SeasonInput} from "./types/SeasonInput";
import {WikiClient} from "../wikiData/WikiClient";
import {Container} from "typedi";
import {SeasonPlanChallenge} from "../entity/game-state/SeasonPlanChallenge";


@Resolver()
export class SeasonResolver {

    private wikiClient = Container.get(WikiClient);

    constructor(
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(Kategorie) private readonly kategorieRepository: Repository<Kategorie>,
        @InjectRepository(Oberthema) private readonly oberthemaRepository: Repository<Oberthema>,
        @InjectRepository(Props) private readonly propsRepository: Repository<Props>,
        @InjectRepository(Quelle) private readonly quelleRepository: Repository<Quelle>,
        @InjectRepository(Themenwoche) private readonly themenwocheRepository: Repository<Themenwoche>,
        @InjectRepository(WikiImage) private readonly wikiImageRepository: Repository<WikiImage>,
        @InjectRepository(WikiWarning) private readonly wikiWaringRepsitory: Repository<WikiWarning>,
        @InjectRepository(Season) private readonly seasonRepsitory: Repository<Season>,
        @InjectRepository(SeasonPlan) private readonly seasonPlanRepsitory: Repository<SeasonPlan>,
        @InjectRepository(SeasonPlanChallenge) private readonly seasonPlanChallengeRepsitory: Repository<SeasonPlanChallenge>,
    ) {}

    @Query(returns => [Season], {nullable: true})
    async seasons(@Ctx() {user}): Promise<Season[]> {
        return this.seasonRepsitory.find();
    }

    @Query(returns => Season, {nullable: true})
    async season(@Ctx() {user}, @Arg("seasonId", type => Int) seasonId: number): Promise<Season> {
        return this.seasonRepsitory.findOne({id: seasonId});
    }

    @Authorized("ADMIN")
    @Mutation(returns => Season, {nullable: true})
    async updateSeason(@Ctx() {user}, @Arg("season", type => SeasonInput) seasonInput: SeasonInput): Promise<Season> {
        let season: Season;

        if(seasonInput.id) {
            season = await this.seasonRepsitory.findOne(seasonInput.id);
        } else {
            season = new Season();
        }
        season.startDate = seasonInput.startDate ||season.startDate;
        season.startOffsetDate = seasonInput.startOffsetDate ||season.startOffsetDate;
        season.endDate = seasonInput.endDate || season.endDate;
        season.title = seasonInput.title || season.title;

        return this.seasonRepsitory.save(season);
    }

    @Authorized("ADMIN")
    @Mutation(returns => Season, {nullable: true})
    async removeSeason(@Ctx() {user}, @Arg("seasonId", type => Int) seasonId: number): Promise<Season> {
        const season = await this.seasonRepsitory.findOne(seasonId);
        if(season)
            return this.seasonRepsitory.remove(season);
        else
            return Promise.reject("Season not found!")
    }

    @Authorized("ADMIN")
    @Mutation(returns => SeasonPlan, {nullable: true})
    async removeSeasonPlan(@Ctx() {user}, @Arg("seasonPlanId", type => Int) seasonPlanId: number): Promise<SeasonPlan> {
        const seasonPlan = await this.seasonPlanRepsitory.findOne(seasonPlanId);
        if(seasonPlan)
            return this.seasonPlanRepsitory.remove(seasonPlan);
        else
            return Promise.reject("Season not found!")
    }


    @Query(returns => [Themenwoche], {nullable: true})
    async themenwoches(@Ctx() {user}): Promise<Themenwoche[]> {
        return this.themenwocheRepository.find();
    }

    @Query(returns => Themenwoche, {nullable: true})
    async themenwoche(@Ctx() {user}, @Arg("themenwocheId", type => String) themenwocheId: string): Promise<Themenwoche> {
        return this.themenwocheRepository.findOne({where: {title: themenwocheId}});
    }

    @Query(returns => [SeasonPlan], {nullable: true})
    async seasonPlans(@Ctx() {user}): Promise<SeasonPlan[]> {
        return this.seasonPlanRepsitory.find();
    }

    @Query(returns => SeasonPlan, {nullable: true})
    async seasonPlan(@Ctx() {user}, @Arg("seasonId", type => Int) seasonId: number): Promise<SeasonPlan> {
        return this.seasonPlanRepsitory.findOne(seasonId);
    }

    @Authorized("ADMIN")
    @Mutation(returns => SeasonPlan, {nullable: true})
    async updateSeasonPlan(@Ctx() {user}, @Arg("seasonPlan", type => SeasonPlanInput) seasonPlanInput: SeasonPlanInput): Promise<SeasonPlan> {
        let seasonPlan: SeasonPlan;
        if( seasonPlanInput.id) {
            seasonPlan = await this.seasonPlanRepsitory.findOne({id: seasonPlanInput.id});
            seasonPlan.position = 0;
        }
        if(!seasonPlan) seasonPlan = new SeasonPlan();
        seasonPlan.season = Promise.resolve(seasonPlanInput.seasonId ? await this.seasonRepsitory.findOne({id: seasonPlanInput.seasonId}) : await seasonPlan.season);
        let themenwoche = seasonPlanInput.themenwocheId ? await this.themenwocheRepository.findOne({title: seasonPlanInput.themenwocheId}) : await seasonPlan.themenwoche;
        let usages = await themenwoche.usages;
        if (usages)
            usages.push(seasonPlan);
        else
            usages = [seasonPlan];
        themenwoche.usages = Promise.resolve(usages);
        themenwoche = await this.themenwocheRepository.save(themenwoche);
        seasonPlan.themenwoche = Promise.resolve(themenwoche);

        seasonPlan.duration = seasonPlanInput.duration ? seasonPlanInput.duration : seasonPlan.duration;
        seasonPlan.position = seasonPlanInput.position ? seasonPlanInput.position : seasonPlan.duration;
        seasonPlan = await  this.seasonPlanRepsitory.save(seasonPlan);

        let seasonPlanChallenges: SeasonPlanChallenge[] = await Promise.all((await themenwoche.challenges).map( async (challenge): Promise<SeasonPlanChallenge> => {
            let seasonPlanChallenge = new SeasonPlanChallenge();
            seasonPlanChallenge.challenge = Promise.resolve(challenge);
            seasonPlanChallenge.plan = Promise.resolve(seasonPlan);
            return this.seasonPlanChallengeRepsitory.save(seasonPlanChallenge);
        }));

        seasonPlan.challenges = Promise.resolve(seasonPlanChallenges);
        seasonPlan = await  this.seasonPlanRepsitory.save(seasonPlan);
        console.log(seasonPlan);
        return seasonPlan;
    }

    @Query(returns => [Props], {nullable: true})
    async allPagesWithWarings(@Ctx() {user}): Promise<Props[]> {
        return this.wikiClient.getAllPagesWithWarnings();
    }

    @Query(returns => Props, {nullable: true})
    async getPageProps(@Ctx() {user}, @Arg("pageId", type => Int) pageId: number): Promise<Props> {
        return this.propsRepository.findOne(pageId);
    }

    @Query(returns => [Kategorie], {nullable: true})
    async kategories(@Ctx() {user}): Promise<Kategorie[]> {
        const kategories = await this.kategorieRepository.find();
        return kategories;
    }

    @Query(returns => Kategorie, {nullable: true})
    async kategorie(@Ctx() {user}, @Arg("kategorieId", type => String) kategorieId: string): Promise<Kategorie> {
        return this.kategorieRepository.findOne(kategorieId)
    }

    @Query(returns => [Oberthema], {nullable: true})
    async oberthemas(@Ctx() {user}): Promise<Oberthema[]> {
        return this.oberthemaRepository.find();
    }

    @Query(returns => Oberthema, {nullable: true})
    async oberthema(@Ctx() {user}, @Arg("oberthemaId", type => String) oberthemaId: string): Promise<Oberthema> {
        return this.oberthemaRepository.findOne(oberthemaId)
    }



}