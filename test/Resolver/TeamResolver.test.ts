import {Container} from "typedi";
import {TeamResolver} from "../../src/resolver/TeamResolver";
import {mkUser, initTestContainer, tearDownDB} from "../intTestEnv";
import {Role, User} from "../../src/entity/user/User";
import {getRepository} from "typeorm";
import {Team, TeamSize} from "../../src/entity/social/Team";

let tr: TeamResolver;
let users: User[];

async function initTeamResolver() {
    await initTestContainer();

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

//only run whole describe block
describe('creating and joining teams', () => {
    let test01id, test01JoinTestId;
    test('a logged in user can create a team', async () => {
        let createdTeam = await tr.createTeam({teamName: "test01", teamDescription: "test01"}, {user: users[0]} )
        expect(createdTeam).toBeInstanceOf(Team);
        expect(createdTeam.name).toBe("test01");
        expect(createdTeam.description).toBe("test01");
        test01id = createdTeam.id;
    });
    test('request join', async () => {
        let joinedMembership = await tr.requestJoinTeam( test01id,{user: users[1]} );
        let joinedTeam = await joinedMembership.team;
        let joinedUser = await joinedMembership.user;
        expect(joinedTeam).toBeInstanceOf(Team);
        expect(joinedTeam.name).toBe("test01");
        expect(joinedTeam.description).toBe("test01");
        expect(joinedUser).toEqual(users[1]);
        expect(joinedMembership.isActive).toBeFalsy();
        expect(joinedMembership.isAdmin).toBeFalsy();
        test01JoinTestId = joinedMembership.id;
    });
    test('accept join request', async () => {
        let acceptedMembership = await tr.confirmMember(test01JoinTestId, {user: users[0]});
        expect(acceptedMembership.isActive).toBeTruthy();
    });
    test('team size is updated after user joined', async () => {
        await new Promise(r => setTimeout(r, 1000));
        let team = await tr.getMyTeam(test01id, {user: users[0]});
        expect(team.teamSize).toBe(TeamSize.DUO);
        console.log(team);
    })

});

describe('managing team permissions', () => {

})

describe('searching teams', () => {

})

test('searchTeamsByName', async () => {
    const data = await tr.searchTeamsByName("test01");
    expect(data).toHaveLength(1)
});


