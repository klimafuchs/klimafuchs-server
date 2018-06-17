import {
    BeforeInsert,
    Column,
    Entity,
    getRepository,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    ManyToOne
} from "typeorm";
import {User} from "./User";
import {Challenge} from "./Challenge";
import {Member} from "./Member";

@Entity()
export class Group {


    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string = "placeholder";

    @OneToMany(type => Member, member => member.group, {eager: true})
    members: Member[];

    @Column()
    inviteId: string;

    @ManyToMany(type => Group, group => group.follows)
    @JoinTable()
    followees: Group[];

    @ManyToMany(type => Group, group => group.followees)
    follows: Group[];


    // @ManyToMany(type => Challenge, challenge => challenge.completedBy, {eager: true})
    // @JoinTable()
    // challengesCompleted: Challenge[];

    @BeforeInsert()
    async generateInviteId() {
        if (this.inviteId == null) { // TODO simplify
            let candidate: string = Math.random().toString(36).substring(7);
            this.inviteId = candidate
        }

/*
            let candidate: string = null;
            while (candidate == null) {
                let temp = Math.random().toString(36).substring(7);
                let group = await getRepository(Group).find({inviteId: temp});
                if (!group) {
                    candidate  = Math.random().toString(36).substring(7);
                }
            }
            this.inviteId = candidate;
*/
    }

    async completedChallenges() : Promise<Challenge[]> {

        let m = await Group.asyncLoadUsers(this.members);

        let membersChallenge = await this.challengeProgress();
        let completedChallengeIds = [];

        membersChallenge.forEach( (k, v) => {
            if(k.length == m.length) completedChallengeIds.push(v);
        });

        let completedChallenges = [];

        for (let i = 0; i < completedChallengeIds.length; i++) {
            let e = await getRepository(Challenge).findOne({where: {id: completedChallengeIds[i]}});
            completedChallenges.push(e);
        }

        return completedChallenges;
    }

    async challengeProgress() : Promise<Map<Number,[Number]>> {
        let m = await Group.asyncLoadUsers(this.members);

        let membersChallenge = new Map();

        m.forEach(m => {
            m.completedChallenges.forEach(c => {
                if (!membersChallenge.has(c.id)) {
                    membersChallenge.set(c.id, [m.id]);
                } else {
                    let currentM = membersChallenge.get(c.id);
                    currentM.push(m.id);
                    membersChallenge.set(c.id,currentM);
                }
            });
        });
        return membersChallenge;
    }

    private static async asyncLoadUsers(members) {
        let m = [];
        for (let i = 0; i < members.length; i++) {
            let e = await getRepository(Member).findOne({where: {id: members[i].id}, relations: ["user"]});
            const score = await e.getIndividualScore();
            let temp = {
                completedChallenges: e.challengesCompleted,
                score: score,
                ...e.user.transfer(false),
            }
            m.push(temp);
        }
        return m;
    }

    public async transfer(fullProfile : boolean = false) {
        let members = await Group.asyncLoadUsers(this.members);
        return await {
            id: this.id,
            name: this.name,
            members: members,
            score: await this.getScore(),
            inviteId: fullProfile ? this.inviteId : ''
        };
    }


    public async getFollows() : Promise<Group[]>{
        const loadedRelations = await getRepository(Group).findOne({where: {id: this.id}, relations: ["followees"]});
        return loadedRelations.followees
    }

    async getScore(): Promise<number> {
        let m = await Group.asyncLoadUsers(this.members);
        const size = m.length;
        let score = 0;

        //Get score for challenges
        const challengeProgress = await this.challengeProgress();
        let scoring : Promise<number>[] = Array.from(challengeProgress).map( async(k,v) => {
            let c = await getRepository(Challenge).findOne({where: {id: k[0]}}); //wat
            return (c.score * (k[1].length/size));
        });
        let scores = await Promise.all(scoring);
        score += scores.reduce((acc, val) => acc + val, 0);

        //Get individual scores from challenges
        score += m.reduce((acc, val) => acc + val.score, 0);

        return score;
    }

    async getScoreHistory() {
        let m = await Group.asyncLoadUsers(this.members);
        const size = m.length;
        let score = 0;

        //Get score for challenges
        const challengeProgress = await this.challengeProgress();
        let scoring = Array.from(challengeProgress).map( async(k,v) => {
            let c = await getRepository(Challenge).findOne({where: {id: k[0]}}); //wat
            return {cId: k[0] , score: (c.score * (k[1].length/size)), maxScore: c.score};
        });
        let scores = await Promise.all(scoring);
        return scores
    }
}
