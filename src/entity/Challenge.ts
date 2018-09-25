import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Group} from "./Group";
import {Member} from "./Member";


@Entity()
export class Challenge {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({type: "text"})
    description: string;

    @Column({ type: "text", nullable: true })
    tip: string;
}
