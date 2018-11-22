import {CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {ObjectType} from "type-graphql";
import {User} from "../user/User";

@Entity()
@ObjectType()
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