import {initTestContainer, mkUser} from "../intTestEnv";
import {Container} from "typedi";
import {WikiClient} from "../../src/wikiData/WikiClient";

let wikiClient;

async function initWikiClient() {
    wikiClient = Container.get(WikiClient);
    return;
}

beforeAll(async () => {
    await initTestContainer();
    await initWikiClient();
});

describe('loading challenge data from wiki', () => {
   test('reinitializing wiki', async () => {
       expect(await wikiClient.fetchAllPages()).resolves;
   })
});