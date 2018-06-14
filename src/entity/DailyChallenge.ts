import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Member} from "./Member";

@Entity()
export class DailyChallenge {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "text" })
    title: String;

    @Column({type: "text"})
    description: String;

    @Column({nullable: true})
    tested: number;

    @Column()
    score: number = 1;

    @Column({ type: "text",  nullable: true })
    sources: string;

    @Column({ type: "text", nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @Column()
    active: boolean = false;

    @ManyToMany(type => Member, member => member.dailiesCompleted)
    completedBy: Member[];
}