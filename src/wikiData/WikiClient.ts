import axios from "axios";
import {Challenge} from "../entity/Challenge";
import {Topic} from "../entity/Topic";
import {Service} from "typedi";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";
import * as Nearley from "nearley";
import * as grammar from "./topicweekGrammar";
let config = require("../../config.json");

@Service()
export class WikiClient {

    constructor(
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(Topic) private readonly topicRepository: Repository<Topic>,
    ){}

    private connection = axios.create({
        baseURL: config.wikiUrl,
        timeout: 1000,
    });

    public async getChallenges(): Promise<Challenge[]> {
        const res = await this.connection.get("/api.php?action=query&format=json&list=categorymembers&cmtitle=Kategorie%3AThemenwoche");
        console.log(res.data.query.categorymembers);
        const pages = res.data.query.categorymembers.map( (val) => ( val.title.slice(0,8) !== "Vorlage:" ) ? val.pageid : null).filter((val) => val !== null);
        // /wiki/api.php?action=query&format=json&prop=revisions&pageids=4&rvprop=content
        const wikiData = await this.connection.get( `/api.php?action=query&format=json&prop=revisions&pageids=${encodeURIComponent(pages.join('|'))}&rvprop=content`);
        pages.forEach((index) => this.parseTopicWeekTemplate(wikiData.data.query.pages[index].revisions[0]['*']));
        //pages.forEach((index) => console.log(wikiData.data.query.pages[index].revisions[0]['*']));

        return undefined;
    }

    private isTopicWeekTemplate(wikiText:string): boolean {
        return wikiText.slice(2, 13) === "Themenwoche"
    }

    private parseTopicWeekTemplate(wikiText: string): Topic {
        const parser = new Nearley.Parser(Nearley.Grammar.fromCompiled(grammar))
        try {
            parser.feed(wikiText);
        } catch (e) {
            console.error(e + `\nText:\n${wikiText}`)
            return null;
        }
        console.log(parser.results);
        return undefined;
    }

    private extractTopicWeek(wikiText: string): String {
        return undefined;

    }

    public async getTopics(): Promise<Topic[]> {
        return undefined;
    }

    public async syncData() {
        const topics = await this.getTopics();
        const challenges = await this.getChallenges();

        this.topicRepository.save(topics)
            .then(topics => console.log("Updated topic data from WikiClient!"))
            .catch(err => console.error("WikiClient Error: " + err.toString()));
        this.challengeRepository.save(challenges)
            .then(challenges => console.log("Updated challenge data from WikiClient!"))
            .catch(err => console.error("WikiClient Error: " + err.toString()));

    }
}