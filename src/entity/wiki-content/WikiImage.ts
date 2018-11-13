import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Props} from "./Props";
import {Field, Int} from "type-graphql";

@Entity()
export class WikiImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    mimetype: String;

    @Field(type => String)
    @Column()
    url: String;

    @ManyToOne(type => Props)
    props: Props
}