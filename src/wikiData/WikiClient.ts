import axios from "axios";
import {Challenge} from "../entity/wiki-content/Challenge";
import {Topic} from "../entity/Topic";
import {Service} from "typedi";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";
import * as Nearley from "nearley";
import * as grammar from "./topicweekGrammar";
import {Props, WikiProps} from "../entity/wiki-content/Props";
import {Themenwoche} from "../entity/wiki-content/Themenwoche";

let config = require("../../config.json");


@Service()
export class WikiClient {

    private static requestAllTopicsParamObject = {
        action: "query",
        format: "json",
        list: "categorymembers",
        cmtitle: "Kategorie%3AThemenwoche"
    }

    private static requestTemplatesForPage(pageIds: Number[]) {
        return {
            action: "query",
            format: "json",
            prop: "revisions|pageprops",
            pageids: encodeURIComponent(pageIds.join('|')),
            rvprop: "ids|timestamp|flags|comment|user|content"
        }
    }

    public paramObjectToUrl(params: Object): string {
        return "/api.php?" + Object.keys(params).map(key => {
            return `${key}=${params[key]}&`
        }).join('').slice(0, -1);
    }


    private parser = new Nearley.Parser(Nearley.Grammar.fromCompiled(grammar));
    private readonly clean;

    constructor(
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(Topic) private readonly topicRepository: Repository<Topic>,
    ) {
        this.clean = this.parser.save();
    }

    private connection = axios.create({
        baseURL: config.wikiUrl,
        timeout: 1000,
    });

    public async getChallenges(): Promise<Challenge[]> {

        return undefined;
    }

    public async getData(): Promise<Object[][]> {
        const res = await this.connection.get(this.paramObjectToUrl(WikiClient.requestAllTopicsParamObject));
        console.log(res.data.query.categorymembers);
        const pages = res.data.query.categorymembers.map((val) => (val.title.slice(0, 8) !== "Vorlage:") ? val.pageid : null).filter((val) => val !== null);
        // /wiki/api.php?action=query&format=json&prop=revisions&pageids=4&rvprop=content
        const wikiData = await this.connection.get(this.paramObjectToUrl(WikiClient.requestTemplatesForPage(pages)));
        const extractedData = pages.map((index) => {
            //let props = {wikiData.data.}
            const pageData = wikiData.data.query.pages[index];
            const wikiProps: WikiProps = {
                pageid: pageData.pageid,
                revid: pageData.revisions[0].revid,
                parentid: pageData.revisions[0].parentid,
                user: pageData.revisions[0].user,
                timestamp: new Date(pageData.revisions[0].timestamp)
            };
            const templateData = this.parseWikiTemplates(wikiData.data.query.pages[index].revisions[0]['*']);
            return {wikiProps: wikiProps, templateData: templateData};
        });
        console.log(JSON.stringify(extractedData))
        //pages.forEach((index) => console.log(wikiData.data.query.pages[index].revisions[0]['*']));
        return extractedData;
    }

    private parseWikiTemplates(wikiText: string): [Object] {
        this.parser.restore(this.clean);
        try {
            this.parser.feed(wikiText);
            return this.parser.results[0];
        } catch (e) {
            console.error(e + `\nText:\n${wikiText}`)
            return null;
        }
    }

    private extractTopicWeek(wikiText: string): String {
        return undefined;

    }

    public async getTopics(): Promise<Topic[]> {
        return undefined;
    }

    public gen(data) {
        console.log(data);
        data.forEach((val, i) => {
            //save meta info from wiki
            const props: Props = Props.create(val.wikiProps);
            //download media
            //create topic data
            let topicTemplate = val.templateData.filter((template) => template.templateName === "Themenwoche");
            if (topicTemplate.length > 0) {
                topicTemplate = topicTemplate[0];
            } else {
                throw new EvalError("Wikipage contained no Topic")
            }
            let topic: Themenwoche = Themenwoche.fromTemplate(topicTemplate.templateValues);
            let challengeTemplates = val.templateData.filter((template) => template.templateName === "Challenge");
            const challenges: Challenge[] = challengeTemplates.map((challengeTemplate) => Challenge.fromTemplate(challengeTemplate));
            console.log(props);
            console.log(topicTemplate);
            console.log(challengeTemplates);
        })
    }

    public async syncData() {
        const wikiData = await this.getData();
        this.gen(wikiData);
        const topics = await this.getTopics();
        const challenges = await this.getChallenges();
        /* TODO persist data
        this.topicRepository.save(topics)
            .then(topics => console.log("Updated topic data from WikiClient!"))
            .catch(err => console.error("WikiClient Error: " + err.toString()));
        this.challengeRepository.save(challenges)
            .then(challenges => console.log("Updated challenge data from WikiClient!"))
            .catch(err => console.error("WikiClient Error: " + err.toString()));
        */

    }
}