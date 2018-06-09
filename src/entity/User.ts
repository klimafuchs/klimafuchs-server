import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, OneToOne, CreateDateColumn} from "typeorm";
import * as bcrypt from 'bcrypt-nodejs';
import {Group} from "./Group";
import {dateFormat} from "dateformat";
import {Member} from "./Member";


export enum Role {
    User = 0,
    Admin = 1
}

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userName: string;

    @Column()
    screenName: string;

    @CreateDateColumn()
    dateCreated: Date;

    @Column()
    emailConfirmed: boolean = false;

    @Column()
    isBanned: boolean = false;

    @Column()
    hash: string;
    password: string;



    @Column()
    role: Role = 0;

    @OneToOne(type => Member, m => m.user, {eager: true})
    membership: Member;


    @BeforeInsert()
    public encrypt () {
        this.hash = bcrypt.hashSync(this.password, bcrypt.genSaltSync()); //TODO make more async
    }

    public validatePassword(candidate: string): boolean {
        return bcrypt.compareSync(candidate, this.hash)
    }

    public transfer(fullProfile : boolean = false) {
        let o;
        if (fullProfile) {
            o =   {
                id : this.id,
                userName : this.userName,
                screenName: this.screenName,
                dateCreated: this.dateCreated,
                emailConfirmed : this.emailConfirmed,
                isBanned : this.isBanned,
                hasGroup: !!this.membership
            }
        } else {
            o =   {
                id : this.id,
                screenName: this.screenName
            }
        }

        return o;
    }
}
