import {BeforeInsert, Column, Entity, getRepository, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";

@Entity()
export class Group {


    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => User, user => user.group, {eager: true})
    members: User[];

    @Column()
    inviteId: string;

    @OneToMany(type => Group, group => group.follows)
    followees: Group[];

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
                inviteId : this.inviteId
            };
            Array.from(this.members).forEach(value => {
                o.members.push({id: value.id, screenName :value.screenName})
            })
        } else {
            o =   {
                id : this.id,
                name: this.name,
                members : []
            };
            Array.from(this.members).forEach(value => {
                o.members.push({id: value.id, screenName :value.screenName})
            })
        }
        return o;
    }

    public async follows() : Promise<Group[]>{
        const loadedRelations = await getRepository(Group).findOne({where: {id: this.id}, relations: ["Group"]});
        return loadedRelations.followees
    }
}
