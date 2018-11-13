import {
    Column,
    CreateDateColumn,
    Entity, JoinTable,
    ManyToMany,
    ManyToOne, OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Quelle} from "./Quelle";
import {Media} from "../Media";
import {Oberthema} from "./Oberthema";
import {Challenge} from "./Challenge";
import {Props} from "./Props";
import {WikiImage} from "./WikiImage";

@Entity()
export class Themenwoche{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({type: "text"})
    content: string;

    @ManyToOne(type => WikiImage)
    headerImage: WikiImage;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(type => Oberthema, o => o.themenWochen)
    oberthema: Oberthema;

    @OneToMany(type => Challenge, c => c.themenWoche)
    challenges: Challenge[];

    @ManyToOne(type => Props)
    props: Props;

    @JoinTable()
    @ManyToMany(type => Quelle)
    quellen: Quelle[];
}