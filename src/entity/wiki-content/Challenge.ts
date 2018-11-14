import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable, ManyToMany, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Themenwoche} from "./Themenwoche";
import {Props} from "./Props";

@Entity()
export class Challenge {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({type: "text"})
    content: string;

    @Column({ type: "text", nullable: true })
    tip: string;

    @Column()
    isSpare: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToMany(type => Themenwoche, t => t.challenges)
    themenWoche: Themenwoche;

    @ManyToOne(type => Props)
    props: Props

    static fromTemplate(challengeTemplate: any) {
        
    }
}
