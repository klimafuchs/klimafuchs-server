import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Topic} from "./Topic";

@Entity()
export class Season {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    startDate: Date;

    @OneToMany(type => Topic, topic => topic.season, {eager: true})
    topics: Topic[];
}