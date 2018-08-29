import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    ManyToOne,
    OneToOne,
    CreateDateColumn,
    JoinColumn, OneToMany
} from "typeorm";
import {ObjectType, Field, Int} from "type-graphql";
import * as bcrypt from 'bcrypt-nodejs';
import {Group} from "./Group";
import {dateFormat} from "dateformat";
import {Member} from "./Member";
import {PasswordResetToken} from "./PasswordResetToken";
import {FeedPost} from "./FeedPost";
import {FeedComment} from "./FeedComment";
import {Media} from "./Media";


export enum Role {
    User = 0,
    Admin = 1
}

@Entity()
@ObjectType()
export class User { //TODO split into profile data and user data

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    userName: string;

    @Field(type => String)
    @Column()
    screenName: string;

    @Field(type => Date)
    @CreateDateColumn()
    dateCreated: Date;

    @Field(type => Boolean)
    @Column()
    emailConfirmed: boolean = false;

    @Field(type => Boolean)
    @Column()
    isBanned: boolean = false;

    @Field(type => Media, {nullable: true})
    @ManyToOne(type => Media, {nullable: true}) //  TODO eagerness?
    avatar?: Media;

    @Field(type => [Media])
    @OneToMany(type => Media, media => media.uploader)
    media: [Media];

    @Column()
    hash: string;
    password: string;

    @OneToMany(type => FeedPost, post => post.author)
    posts: FeedPost[];

    @OneToMany(type => FeedPost, post => post.author)
    comments: FeedComment[];

    @Field(type => Int)
    @Column()
    role: Role = 0;

    @OneToOne(type => Member, m => m.user, {eager: true})
    membership: Member;

    @OneToOne(type => PasswordResetToken, p => p.user)
    passwordResetToken: PasswordResetToken;

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
