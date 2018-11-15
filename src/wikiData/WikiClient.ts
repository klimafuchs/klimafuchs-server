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
import {Kategorie} from "../entity/wiki-content/Kategorie";
import {Oberthema} from "../entity/wiki-content/Oberthema";
import {WikiImage} from "../entity/wiki-content/WikiImage";
import {WikiWarning, WikiWarnings} from "../entity/wiki-content/WikiWarning";
import {Quelle} from "../entity/wiki-content/Quelle";

let config = require("../../config.json");


@Service()
export class WikiClient {

    private static requestAllTopicsParamObject = {
        action: "query",
        format: "json",
        list: "categorymembers",
        cmtitle: "Kategorie%3AThemenwoche"
    }

    private parser = new Nearley.Parser(Nearley.Grammar.fromCompiled(grammar));

    private readonly clean;

    private connection = axios.create({
        baseURL: config.wikiUrl,
        timeout: 1000,
    });

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


    public paramObjectToUrl(params: Object): string {
        return "/api.php?" + Object.keys(params).map(key => {
            return `${key}=${params[key]}&`
        }).join('').slice(0, -1);
    }

    public async getData(): Promise<Object[][]> {
        const res = await this.connection.get(this.paramObjectToUrl(WikiClient.requestAllTopicsParamObject));
        console.log(res.data.query.categorymembers);
        const pages = res.data.query.categorymembers.map((val) => (val.title.slice(0, 8) !== "Vorlage:") ? val.pageid : null).filter((val) => val !== null);
        // /wiki/api.php?action=query&format=json&prop=revisions&pageids=4&rvprop=content
        const wikiData = await this.connection.get(this.paramObjectToUrl(WikiClient.requestTemplatesForPages(pages)));
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

    public gen(data) {
        console.log(data);
        data.forEach(async (val, i) => {
            //save meta info from wiki
            let props: Props = Props.create(val.wikiProps);

            props = await this.propsRepository.save(props);

            let warnings: WikiWarnings[] = [];
            try {
                if (!val.templateData) {
                    warnings.push(WikiWarnings.TemplateParsingError);
                    throw new Error(warnings.toString())
                }

                // extract structured data
                let topicTemplate = val.templateData.filter((template) => template.templateName === "Themenwoche");
                let challengeTemplates = val.templateData.filter((template) => template.templateName === "Challenge");

                //validate data
                if (topicTemplate.length > 0) {
                    topicTemplate = topicTemplate[0];
                } else {
                    console.error("Wikipage contained no Topic");
                }
                let topic: Themenwoche = Themenwoche.fromTemplate(topicTemplate.templateValues);
                let kategorie: Kategorie = Kategorie.fromWeekTemplate(topicTemplate.templateValues);
                let oberthema: Oberthema = Oberthema.fromWeekTemplate(topicTemplate.templateValues);
                let challenges: Challenge[] = challengeTemplates.map((challengeTemplate) => Challenge.fromTemplate(challengeTemplate.templateValues));

                let imageInfo = await this.connection.get(this.paramObjectToUrl(WikiClient.requestImagesForFile(topicTemplate.templateValues.HeaderImage)));
                let headerImage = WikiImage.fromRequest(imageInfo);
                //TODO validate data

                //persist
                console.log(props);
                console.log(topic);
                console.log(challenges);
                console.log(headerImage)

            } catch (e) {
                console.error(e.message);
            }
            if (warnings.length > 0) {
                let wikiWarning = WikiWarning.fromWarnings(warnings);
                wikiWarning.props = props;
                this.wikiWaringRepsitory.save(wikiWarning)
                    .then(_ => console.log(`Logged warings on page ${props.pageid}!`))
                    .catch(err => console.error("WikiClient Error: " + err.toString()));

            }

        })
    }

    public async syncData() {
        const wikiData = await this.getData();
        this.gen(wikiData);
        /* TODO persist data
        this.topicRepository.save(topics)
            .then(topics => console.log("Updated topic data from WikiClient!"))
            .catch(err => console.error("WikiClient Error: " + err.toString()));
        this.challengeRepository.save(challenges)
            .then(challenges => console.log("Updated challenge data from WikiClient!"))
            .catch(err => console.error("WikiClient Error: " + err.toString()));
        */

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


}