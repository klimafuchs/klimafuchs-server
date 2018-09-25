import {Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Season} from "./Season";
import {Media} from "./Media";

@Entity()
export class Topic {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Season, s => s.topics)
    season: Season;

    @Column()
    title: string;

    @ManyToMany(type => Media)
    headerImg: Media;

    @Column({type: "text",})
    description: string;



}