import {initTestContainer} from "../intTestEnv";

function initGSR() {

}

beforeAll(async () => {
    await initTestContainer();
    await initGSR();
});
