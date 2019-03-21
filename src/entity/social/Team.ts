import {BeforeInsert, Column, Entity, getRepository, ManyToOne, OneToMany, PrimaryGeneratedColumn,} from "typeorm";
import {Membership} from "./Membership";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {Media} from "../Media";
import {generate} from "shortid";
import {Container} from "typedi";
import {LeaderBoardManager} from "../../gameLogic/LeaderBoardManager";


export enum TeamSize {
    SOLO = 0, DUO = 1, SMALL = 2, LARGE = 3, HUGE = 4
}

export const teamSizeForSize = (size) => {
    switch (size) {
        case (size <= 1):
            return TeamSize.SOLO;
        case (size <= 2):
            return TeamSize.DUO;
        case (size <= 5):
            return TeamSize.SMALL;
        case (size <= 10):
            return TeamSize.LARGE;
        default:
            return TeamSize.HUGE;
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
    @Column({default: TeamSize.SOLO})
    teamSize: TeamSize;

    @Field(type => [Membership], {nullable: true})
    @OneToMany(type => Membership, member => member.team, {nullable: true})
    members?: Promise<Membership[]>;

    @Field(type => Int)
    @Column({default: 0})
    score: number;

    @Field(type => Int, {nullable: true})
    @Column({default: -1}) // if this value is -1 the team has no points at all;
    place: number;

    @BeforeInsert()
    setInviteIdIfNoneExists() {
        this.inviteId = this.inviteId || generate();
    }

    public async addScore(points: number) {
        this.score += points;
        console.log(this);
        let res = await getRepository(Team).save(this).catch(err => {
            throw err
        });
        console.log(res);

    }

    public async updateTeamSize(action) {
        let members = await this.members;
        members = members.filter(m => m.isActive);
        this.teamSize = teamSizeForSize(members.length);
        getRepository(Team).save(this).catch(err => {
            throw err
        });
    }

    private async getPosition() {
        if (this.score === 0) {
            return -1;
        }
        let rawQueryResult: any = await getRepository(Team).query(
            "SELECT COUNT(*) AS inFront " +
            "FROM `team` " +
            "WHERE `team`.`score` > " +
            "(SELECT `score` FROM `team` WHERE `team`.`id` = ?) " +
            "AND `team`.`teamSize` = ?;",
            [this.id, this.teamSize.valueOf()] // eh
        );
        const place = Number(rawQueryResult[0].inFront) + 1;
        console.log({id: this.id, place, rawQueryResult});
        return place; // the leader board should start at 1st instead of 0th place
    }

    public async reinitPosition() {
        this.place = await this.getPosition();
        return getRepository(Team).save(this).catch(err => {
            throw err
        });
    }
}
