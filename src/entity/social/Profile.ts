import {Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Media} from "../Media";
import {Field} from "type-graphql";
import {FeedComment} from "./FeedComment";
import {FeedPost} from "./FeedPost";

@Entity()
export class Profile{

    @PrimaryGeneratedColumn()
    id: number;


}
