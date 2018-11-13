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
import {Challenge} from "./wiki-content/Challenge";

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

    @Column()
    active: Boolean = true;


}
