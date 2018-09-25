import axios from "axios";
import {Challenge} from "./entity/Challenge";
import {Topic} from "./entity/Topic";
let config = require("../config.json");

export class WikiClient {
    private connection = axios.create({
        baseURL: config.wikiUrl,
        timeout: 1000,
    });

    public async getChallenges(): Promise<Challenge[]> {
        const res = await this.connection.get("/api.php?action=query&format=json&list=categorymembers&utf8=1&cmtitle=Kategorie%3AThemenwoche");
        console.log(res.data.query.categorymembers);
        return undefined;
    }

    public async getTopics(): Promise<Topic[]> {
        return undefined;
    }
}