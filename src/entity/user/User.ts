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
import {Group} from "../social/Group";
import {dateFormat} from "dateformat";
import {Member} from "../social/Member";
import {PasswordResetToken} from "./PasswordResetToken";
import {FeedPost} from "../social/FeedPost";
import {FeedComment} from "../social/FeedComment";
import {Media} from "../Media";
import {ChallengeCompletion} from "../game-state/ChallengeCompletion";
import {Challenge} from "../wiki-content/Challenge";
import Maybe from "graphql/tsutils/Maybe";


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


    @Column()
    hash: string;
    password: string;

    @Field(type => Int)
    @Column()
    role: Role = 0;

    @OneToOne(type => Member, m => m.user, {eager: true})
    membership: Member;

    @OneToOne(type => PasswordResetToken, p => p.user)
    passwordResetToken: PasswordResetToken;

    @Field(type => Media, {nullable: true})
    @OneToOne(type => Media, {nullable: true})
    avatar?: Maybe<Media>;

    @Field(type => [Media], {nullable: true})
    @OneToMany(type => Media, media => media.uploader, {nullable: true})
    media?: Maybe<Media[]>;

    @Field(type => [FeedPost], {nullable: true})
    @OneToMany(type => FeedPost, post => post.author, {nullable: true})
    posts?: Maybe<FeedPost[]>;

    @Field(type => [FeedComment], {nullable: true})
    @OneToMany(type => FeedPost, post => post.author, {nullable: true})
    comments?: Maybe<FeedComment[]>;

    @Field(type => [ChallengeCompletion], {nullable: true})
    @OneToMany(type => ChallengeCompletion, cc => cc.owner, {nullable: true})
    challengeCompletions?: Maybe<ChallengeCompletion[]>;

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
