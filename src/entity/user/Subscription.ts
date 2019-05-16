import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Subscription {

    @Field(type => Int, {nullable: true})
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => User, {nullable: true})
    @OneToOne(type => User)
    @JoinColumn()
    user: Promise<User>;

    @Field(type => String, {nullable: true})
    @Column()
    pushToken: string
}