import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne} from "typeorm";
import * as bcrypt from 'bcrypt-nodejs';
import {Group} from "./Group";
import {dateFormat} from "dateformat";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userName: string;

    @Column()
    screenName: string;

    @Column()
    dateCreated: Date;

    @Column()
    emailConfirmed: boolean = false;

    @Column()
    isBanned: boolean = false;

    @Column()
    hash: string;
    password: string;

    @ManyToOne(type => Group, group => group.members)
    group: Group;

    @BeforeInsert()
    public encrypt () {
        this.hash = bcrypt.hashSync(this.password, bcrypt.genSaltSync()); //TODO make more async
    }

    @BeforeInsert()
    private initDateCreated () {
        this.dateCreated = new Date(Date.now());
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
                group: !this.group ? '' : this.group.id
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
