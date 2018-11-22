import {CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Field, ObjectType} from "type-graphql";
import {User} from "../user/User";

@Entity()
export class ChallengeCompletion {


    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(type => User, u => u.challengeCompletions)
    owner: User;


}