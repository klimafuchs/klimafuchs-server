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

@Entity()
export class Group {


    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string = "placeholder";

    @OneToMany(type => User, user => user.group, {eager: true})
    members: User[];

    @Column()
    inviteId: string;

    @ManyToMany(type => Group, group => group.follows)
    @JoinTable()
    followees: Group[];

    @ManyToMany(type => Group, group => group.followees)
    follows: Group[];

    @ManyToMany(type => Challenge, challenge => challenge.completedBy, {eager: true})
    @JoinTable()
    challengesCompleted: Challenge[];

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

    public transfer(fullProfile : boolean = false) {
        let o;
        if (fullProfile) {
            o =   {
                id : this.id,
                name: this.name,
                members : [],
                inviteId : this.inviteId,
                score: this.getScore(),
            };
            Array.from(this.members).forEach(value => {
                o.members.push({id: value.id, screenName :value.screenName})
            })
        } else {
            o =   {
                id : this.id,
                name: this.name,
                members : [],
                score: this.getScore(),
            };
            Array.from(this.members).forEach(value => {
                o.members.push({id: value.id, screenName :value.screenName})
            })
        }
        return o;
    }

    public async getFollows() : Promise<Group[]>{
        const loadedRelations = await getRepository(Group).findOne({where: {id: this.id}, relations: ["followees"]});
        return loadedRelations.followees
    }

    public getScore() : number {
        let score = 0;
        if(this.challengesCompleted) {
            score += this.challengesCompleted.reduce((acc, val) => acc + val.score, 0)
        }
        return score;
    }
}
