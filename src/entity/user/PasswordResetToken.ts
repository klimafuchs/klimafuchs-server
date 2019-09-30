import {BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class PasswordResetToken {

    @PrimaryGeneratedColumn()
    @Field(type => Int)
    id;

    @OneToOne(type => User, {eager: true})
    @JoinColumn()
    @Field(type => User)
    user: User;

    @CreateDateColumn()
    @Field(type => Date)
    createdAt: Date;

    @Column()
    @Field(type => String)
    resetToken: string;

    @BeforeInsert()
    public genToken() {
        this.resetToken = Math.random().toString(36).substring(2)
    }
}