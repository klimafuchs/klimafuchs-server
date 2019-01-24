import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./user/User";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Media {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @CreateDateColumn()
    uploadedAt: Date;

    @Field(type => String)
    @Column()
    filename: String;

    @Field(type => String)
    @Column()
    encoding: String;

    @Field(type => String)
    @Column()
    mimetype: String;

    @Field(type => String)
    @Column()
    path: String;

    @Field(type => Int)
    @Column({default: 200})
    width: number;

    @Field(type => Int)
    @Column({default: 200})
    height: number;

    @Field(type => User)
    @ManyToOne(type => User, user => user.media)
    uploader: User;
}