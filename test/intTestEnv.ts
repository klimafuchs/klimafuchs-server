import * as TypeORM from "typeorm";
import {Container} from "typedi";
import * as fs from "fs";
import {Role, User} from "../src/entity/user/User";
import {Connection, getRepository} from "typeorm";
import {Tasks} from "../src/tasks";
import {GameProgressionManager} from "../src/gameLogic/GameProgressionManager";
import {LeaderBoardManager} from "../src/gameLogic/LeaderBoardManager";
import * as redis from "redis";
import {RedisClient} from "redis";

//const dbFilePath = "./test/transient.sqlite";
const dbFilePath = ":memory:";
let connection;
export async function initTestContainer() {
    let client: RedisClient = redis.createClient({db: 0});
    Container.set("redis", client);
    TypeORM.useContainer(Container);
    connection = await TypeORM.createConnection({
        type: "sqlite",
        database: dbFilePath,
        entities: [
            "src/entity/**/*.ts"
        ],
        synchronize: true,
        logging: false,
        dropSchema: true
    });
    const tasks = Container.get(Tasks);
    const gameProgressionManager = Container.get(GameProgressionManager);
    const leadboardManager = Container.get(LeaderBoardManager);

}
export async function tearDownDB() {
    await connection.close()
}

export async function mkUser({userName, password, screenName}): Promise<User> {
    let _u = new User();
    _u.userName = userName;
    _u.password = password;
    _u.screenName = screenName;
    _u.role = Role.User;
    const userRepo = getRepository(User);
    _u =await userRepo.save(_u);
    return  _u;
}

export async function mk<T>(type : T) {



}