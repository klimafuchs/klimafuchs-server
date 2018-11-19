import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
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
import {FeedPost} from "../entity/social/FeedPost";
import {Media} from "../entity/Media";
import {UserInput} from "./types/UserInput";
import {SeasonPlanInput} from "./types/SeasonPlanInput";

@Resolver()
export class SeasonResolver {
    
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
    ) {}

    @Query(returns => [Season], {nullable: true})
    async seasons(@Ctx() {user}): Promise<Season[]> {
        return this.seasonRepsitory.find();
    }

    @Query(returns => Season, {nullable: true})
    async season(@Ctx() {user}, @Arg("seasonId", type => Int) seasonId: number): Promise<Season> {
        return this.seasonRepsitory.findOne({id: seasonId});
    }

    @Query(returns => [Themenwoche], {nullable: true})
    async themenwoches(@Ctx() {user}): Promise<Themenwoche[]> {
        return this.themenwocheRepository.find();
    }

    @Query(returns => Themenwoche, {nullable: true})
    async themenwoche(@Ctx() {user}, @Arg("themenwocheId", type => String) themenwocheId: string): Promise<Themenwoche> {
        return this.themenwocheRepository.findOne({title: themenwocheId});
    }

    @Query(returns => [SeasonPlan], {nullable: true})
    async seasonPlans(@Ctx() {user}, @Arg("seasonId", type => Int) seasonId: number): Promise<SeasonPlan[]> {
        const season = await this.seasonRepsitory.findOne({id: seasonId});
        return season.seasonPlan;
    }

    @Mutation(returns => SeasonPlan, {nullable: true})
    async seasonPlan(@Ctx() {user}, @Arg("seasonPlan", type => SeasonPlan) seasonPlanInput: SeasonPlanInput): Promise<SeasonPlan> {
        let seasonPlan: SeasonPlan;
        if( seasonPlanInput.id) {
            seasonPlan = await this.seasonPlanRepsitory.findOne({id: seasonPlanInput.id});
        }
        seasonPlan.season = seasonPlanInput.seasonId ? await this.seasonRepsitory.findOne({id: seasonPlanInput.seasonId}) : seasonPlan.season;
        seasonPlan.themenwoche = seasonPlanInput.themenwocheTitle ? await this.themenwocheRepository.findOne({title: seasonPlanInput.themenwocheTitle}) : seasonPlan.themenwoche;
        seasonPlan.startDate = seasonPlanInput.startDate ? seasonPlanInput.startDate : seasonPlan.startDate;
        seasonPlan.duration = seasonPlanInput.duration ? seasonPlanInput.duration : seasonPlan.duration;
        return this.seasonPlanRepsitory.save(seasonPlan);
    }


}