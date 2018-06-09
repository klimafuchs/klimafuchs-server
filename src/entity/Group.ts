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

        let membersChallenge = new Map();
        let completedChallengIds = [];

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

        membersChallenge.forEach( (k, v) => {
            if(k.length == m.length) completedChallengIds.push(v);
        });

        let completedChallenges = [];

        for (let i = 0; i < completedChallengIds.length; i++) {
            let e = await getRepository(Challenge).findOne({where: {id: completedChallengIds[i]}});
            completedChallenges.push(e);
        }

        return completedChallenges;
    }

    private static async asyncLoadUsers(members) {
        let m = [];
        for (let i = 0; i < members.length; i++) {
            let e = await getRepository(Member).findOne({where: {id: members[i].id}, relations: ["user"]});
            let temp = {
                completedChallenges: e.challengesCompleted,
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
            inviteId: fullProfile ? this.inviteId : '',
            score: await this.getScore()
        };
    }


    public async getFollows() : Promise<Group[]>{
        const loadedRelations = await getRepository(Group).findOne({where: {id: this.id}, relations: ["followees"]});
        return loadedRelations.followees
    }

    async getScore(): Promise<number> {
        let score = 0;
        const completedChallenges = await this.completedChallenges();
        if (completedChallenges) {
            score += completedChallenges.reduce((acc, val) => acc + val.score, 0)
        }
        return score;
    }
}
