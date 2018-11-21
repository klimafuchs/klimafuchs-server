
///////////
////
//// TODO FIX THIS S#!T


import axios from "axios";
import {Challenge} from "../entity/wiki-content/Challenge";
import {Service} from "typedi";
import {InjectRepository} from "typeorm-typedi-extensions";
import {IsNull, Repository} from "typeorm";
import * as Nearley from "nearley";
import * as grammar from "./topicweekGrammar";
import {Props, WikiProps} from "../entity/wiki-content/Props";
import {Themenwoche} from "../entity/wiki-content/Themenwoche";
import {Kategorie} from "../entity/wiki-content/Kategorie";
import {Oberthema} from "../entity/wiki-content/Oberthema";
import {WikiImage} from "../entity/wiki-content/WikiImage";
import {WikiWarning, WikiWarnings} from "../entity/wiki-content/WikiWarning";
import {Quelle} from "../entity/wiki-content/Quelle";
import Maybe from "graphql/tsutils/Maybe";

let config = require("../../config.json");

interface WikiPageData {
    wikiProps,
    templateData
}

@Service()
export class WikiClient {

    private static requestAllTopicsParamObject = {
        action: "query",
        format: "json",
        list: "categorymembers",
        cmtitle: "Kategorie%3AThemenwoche"
    };

    private parser = new Nearley.Parser(Nearley.Grammar.fromCompiled(grammar));

    private readonly clean;

    private connection = axios.create({
        baseURL: config.wikiUrl,
        timeout: 1000,
    });

    constructor(
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(Kategorie) private readonly kategorieRepository: Repository<Kategorie>,
        @InjectRepository(Oberthema) private readonly oberthemaRepository: Repository<Oberthema>,
        @InjectRepository(Props) private readonly propsRepository: Repository<Props>,
        @InjectRepository(Quelle) private readonly quelleRepository: Repository<Quelle>,
        @InjectRepository(Themenwoche) private readonly themenwocheRepository: Repository<Themenwoche>,
        @InjectRepository(WikiImage) private readonly wikiImageRepository: Repository<WikiImage>,
        @InjectRepository(WikiWarning) private readonly wikiWaringRepsitory: Repository<WikiWarning>,
    ) {
        this.clean = this.parser.save();
    }

    private static requestTemplatesForPages(pageIds: Number[]) {
        return {
            action: "query",
            format: "json",
            prop: "revisions|pageprops",
            pageids: encodeURIComponent(pageIds.join('|')),
            rvprop: "ids|timestamp|flags|comment|user|content"
        }
    }

    private static requestImagesForFile(canonicalFileName: string) {
        return {
            action: "query",
            format: "json",
            prop: "imageinfo|revisions",
            indexpageids: 1,
            titles: canonicalFileName,
            iiprop: "timestamp|user|url|mime",
            rvprop: "content"
        }
    }

    public paramObjectToUrl(params: Object): string {
        return "/api.php?" + Object.keys(params).map(key => {
            return `${key}=${params[key]}&`
        }).join('').slice(0, -1);
    }

    public async syncPage(pageId: number) {
        this.fetchPage(pageId)
            .then(data => this.extractPage(pageId, data))
            .catch(e => console.error(e))
    }

    public async syncAllPages() {
        const wikiData = await this.fetchAllPages();
        wikiData.forEach(async (val) => this.savePage(val))
    }

    public async fetchPage(pageId: number): Promise<WikiPageData> {
        const wikiData = await this.connection.get(this.paramObjectToUrl(WikiClient.requestTemplatesForPages([pageId])));
        return this.extractPage(pageId, wikiData);

    }

    public async fetchAllPages(): Promise<WikiPageData[]> {
        const res = await this.connection.get(this.paramObjectToUrl(WikiClient.requestAllTopicsParamObject));
        const pages = res.data.query.categorymembers.map((val) => (val.title.slice(0, 8) !== "Vorlage:") ? val.pageid : null).filter((val) => val !== null);
        const wikiData = await this.connection.get(this.paramObjectToUrl(WikiClient.requestTemplatesForPages(pages)));
        return pages.map((pageId) => {
            return this.extractPage(pageId, wikiData);
        });
    }

    extractPage(pageId: number, wikiData): WikiPageData {
        const pageData = wikiData.data.query.pages[pageId];
        const wikiProps: WikiProps = {
            pageid: pageData.pageid,
            revid: pageData.revisions[0].revid,
            parentid: pageData.revisions[0].parentid,
            user: pageData.revisions[0].user,
            timestamp: new Date(pageData.revisions[0].timestamp)
        };
        const templateData = this.parseWikiTemplates(wikiData.data.query.pages[pageId].revisions[0]['*']);

        return {wikiProps: wikiProps, templateData: templateData};
    }

    public async savePage(pageData: WikiPageData) {
        let props: Props = Props.create(pageData.wikiProps);

        props = await this.propsRepository.save(props);

        let dbWarnings = await this.wikiWaringRepsitory.find({props: {pageid: props.pageid}});
        this.wikiWaringRepsitory.remove(dbWarnings)
            .then(() => console.log(`Warnings on page ${props.pageid} cleared!`))
            .catch(err => console.error("WikiClient Error: " + err.toString()));


        let warnings: WikiWarnings[] = [];
        try {
            if (!pageData.templateData) {
                throw new Error(warnings.toString())
            }

            // extract structured data
            let topicTemplate = pageData.templateData.filter((template) => template.templateName === "Themenwoche");
            let challengeTemplates = pageData.templateData.filter((template) => template.templateName === "Challenge");

            if (!topicTemplate || topicTemplate.length === 0) {
                warnings.push(WikiWarnings.NoTopic)
            } else {
                topicTemplate = topicTemplate[0];
                let themenwoche: Themenwoche = Themenwoche.fromTemplate(topicTemplate.templateValues);
                let kategorie: Kategorie = Kategorie.fromWeekTemplate(topicTemplate.templateValues);
                let oberthema: Oberthema = Oberthema.fromWeekTemplate(topicTemplate.templateValues);

                kategorie.props = props;
                kategorie.oberthemen.push(oberthema);
                kategorie = await this.kategorieRepository.save(kategorie);

                oberthema.props = props;
                oberthema.kategorie = kategorie;
                oberthema.themenWochen.push(themenwoche);
                oberthema = await this.oberthemaRepository.save(oberthema);

                themenwoche.props = props;
                themenwoche.oberthema = oberthema;
                themenwoche.kategorie = kategorie;

                try {
                    let imageInfo = await this.connection.get(this.paramObjectToUrl(WikiClient.requestImagesForFile(topicTemplate.templateValues.HeaderImage)));
                    let headerImage = WikiImage.fromRequest(imageInfo);
                    headerImage.props = props;
                    themenwoche.headerImage = await this.wikiImageRepository.save(headerImage);
                } catch (e) {
                    console.log(e.message);
                    warnings.push(WikiWarnings.NoHeaderImage);
                }


                if (!challengeTemplates || challengeTemplates.length === 0) {
                    warnings.push(WikiWarnings.NoChallenges);
                } else {
                    let challenges: Challenge[] = challengeTemplates.map((challengeTemplate) => Challenge.fromTemplate(challengeTemplate.templateValues));
                    if (challenges.filter(c => !c.isSpare).length < 4) warnings.push(WikiWarnings.NotEnoughDefaultChallenges);
                    if (challenges.filter(c => c.isSpare).length <= 0) warnings.push(WikiWarnings.NoSpareChallenges);

                    challenges = await Promise.all(challenges.map(async challenge => {

                        let dbChallenge = await this.challengeRepository.findOne(challenge);

                        if (dbChallenge) {
                            challenge.id = dbChallenge.id
                        }

                        challenge.props = props;
                        challenge.themenWoche = themenwoche;
                        challenge.kategorie = kategorie;
                        challenge.oberthema = oberthema;
                        this.challengeRepository.save(challenge).catch(e => console.error(e));
                        return challenge;
                    }));

                    console.log(challenges[0].toString());
                    themenwoche.challenges = challenges;
                }
                themenwoche = await this.themenwocheRepository.save(themenwoche);
                console.log(themenwoche);

            }
        } catch (e) {
            console.error(e.message);
            warnings.push(WikiWarnings.TemplateParsingError);
        }
        if (warnings.length > 0) {
            let wikiWarning = WikiWarning.fromWarnings(warnings);
            wikiWarning.props = props;
            this.wikiWaringRepsitory.save(wikiWarning)
                .then(() => console.log(`Logged warnings on page ${props.pageid}!`))
                .catch(err => console.error("WikiClient Error: " + err.toString()));
        }

    }

    private parseWikiTemplates(wikiText: string): [Object] {
        this.parser.restore(this.clean);
        try {
            this.parser.feed(wikiText);
            return this.parser.results[0];
        } catch (e) {
            console.error(e + `\nText:\n${wikiText}`);
            return null;
        }
    }

    public async  getAllPagesWithWarnings(): Promise<Props[]> {
        return this.propsRepository.find({where: {warning: null}});
    }

    public async getWarnings(pageId: number): Promise<WikiWarning> {
        const props = await this.propsRepository.findOne(pageId);
        if(props)
            return props.warnings
        else
            return undefined;
    }
}