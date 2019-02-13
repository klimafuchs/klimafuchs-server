import {
    BeforeInsert,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    ManyToOne,
} from "typeorm";
import {Member} from "./Member";
import {Field, Int, ObjectType} from "type-graphql";
import {Media} from "../Media";
import {generate} from "shortid";

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

    @Field(type => [Member], {nullable: true})
    @OneToMany(type => Member, member => member.team, {nullable: true})
    members?: Promise<Member[]>;

    @Field(type => Int)
    @Column()
    score: number;

    @BeforeInsert()
    setInviteIdIfNoneExists() {
        this.inviteId = this.inviteId || generate();
    }
}
