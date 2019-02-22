import {
    BeforeInsert,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    ManyToOne, getRepository,
} from "typeorm";
import {Membership} from "./Membership";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {Media} from "../Media";
import {generate} from "shortid";


export enum TeamSize {
    SOLO = 0, DUO = 1, SMALL = 2 , LARGE = 3, HUGE = 4
}

export const teamSizeForSize = (size) => {
    switch (size) {
        case (size <= 1): return TeamSize.SOLO;
        case (size <= 2): return TeamSize.DUO;
        case (size <= 5): return TeamSize.SMALL;
        case (size <= 10): return TeamSize.LARGE;
        default: return TeamSize.HUGE;
    }
};

registerEnumType(TeamSize, {
    name: 'TeamSize',
    description: 'team size brackets'
});

@Entity()
@ObjectType()
export class Team {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    name: string;

    // Used to invite people who dont have the app already
    // if an inviteId is set during account creation the new
    // user is added to the team
    @Field(type => String)
    @Column()
    inviteId: string;

    @Field(type => Media, {nullable: true})
    @ManyToOne(type => Media, {nullable: true})
    avatar?: Promise<Media>;

    @Field(type => TeamSize)
    @Column()
    teamSize: TeamSize;

    @Field(type => [Membership], {nullable: true})
    @OneToMany(type => Membership, member => member.team, {nullable: true})
    members?: Promise<Membership[]>;

    @Field(type => Int)
    @Column({default: 0})
    score: number;

    @BeforeInsert()
    setInviteIdIfNoneExists() {
        this.inviteId = this.inviteId || generate();
    }

    public addScore(points: number): void{
        this.score += points;
        getRepository(Team).save(this).catch(err => console.error(err));
    }

    public async updateTeamSize(action){
        let members = await this.members;
        members = members.filter(m => m.isActive);
        this.teamSize = teamSizeForSize(members.length);
        getRepository(Team).save(this).catch(err => console.error(err));
    }

}
