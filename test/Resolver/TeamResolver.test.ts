import {Container} from "typedi";
import {TeamResolver} from "../../src/resolver/TeamResolver";
import {mkUser, initDB, tearDownDB} from "../initTestEnv";
import {Role, User} from "../../src/entity/user/User";
import {getRepository} from "typeorm";
import {Team} from "../../src/entity/social/Team";

let tr: TeamResolver;
let users: User[];

async function initTeamResolver() {
    await initDB();

    //create a few users

    const defaultUsers = [
        {userName: "test0@test.de", password: "test", screenName: "test0"},
        {userName: "test1@test.de", password: "test", screenName: "test1"},
        {userName: "test2@test.de", password: "test", screenName: "test2"},
        {userName: "test3@test.de", password: "test", screenName: "test3"},
        {userName: "test4@test.de", password: "test", screenName: "test4"},
        {userName: "test5@test.de", password: "test", screenName: "test5"},
        {userName: "test6@test.de", password: "test", screenName: "test6"},
        {userName: "test7@test.de", password: "test", screenName: "test7"},
        {userName: "test8@test.de", password: "test", screenName: "test8"},
        {userName: "test9@test.de", password: "test", screenName: "test9"},
        {userName: "test10@test.de", password: "test", screenName: "test10"},
        ];
    users = await Promise.all(defaultUsers.map((u) => mkUser(u)));
    tr = Container.get(TeamResolver);
    return;
}



beforeAll(() => {
    return initTeamResolver();
});

afterAll(() => {
    return tearDownDB()
})

describe('creating and joining teams', () => {
    test('a logged in user can create a team', async () => {
        let createdTeam = await tr.createTeam({teamName: "Foo", teamDescription: "Bar"}, {user: users[0]} )
        expect(createdTeam).toBeInstanceOf(Team);
        expect(createdTeam.name).toBe("Foo");
        expect(createdTeam.description).toBe("Bar");
    });


});

describe('managing team permissions', () => {

})

describe('searching teams', () => {

})

test('searchTeamsByName', async () => {
    const data = await tr.searchTeamsByName("Foo");
    expect(data).toHaveLength(1)
});


