import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    ManyToOne,
    OneToOne,
    JoinColumn,
    CreateDateColumn, ManyToMany, JoinTable, getRepository
} from "typeorm";
import * as bcrypt from 'bcrypt-nodejs';
import {Group} from "./Group";
import {User} from "./User";
import {dateFormat} from "dateformat";
import {Challenge} from "./Challenge";
import {DailyChallenge} from "./DailyChallenge";

@Entity()
export class Member {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => User, user => user.membership, {cascade: true})
    @JoinColumn()
    user: User;

    @ManyToOne(type => Group, {cascade: true})
    @JoinColumn()
    group: Group;

    @CreateDateColumn()
    joinedAt: Date;

    @ManyToMany(type => Challenge, challenge => challenge.completedBy, {eager: true})
    @JoinTable()
    challengesCompleted: Challenge[];

    @ManyToMany(type => DailyChallenge, challenge => challenge.completedBy, {eager: true})
    @JoinTable()
    dailiesCompleted: DailyChallenge[];

    @Column()
    active: Boolean = true;

    public async getIndividualScore() : Promise<Number> {
        return this.dailiesCompleted.reduce((acc, val) => acc + val.score, 0)
    }

}
