import {
    Column,
    CreateDateColumn,
    Entity, JoinTable, ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Kategorie} from "./Kategorie";
import {Themenwoche} from "./Themenwoche";
import {Props} from "./Props";
import {Challenge} from "./Challenge";

@Entity()
export class Oberthema {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(type => Kategorie, k => k.oberthemen)
    kategorie: Kategorie;

    @OneToMany(type => Themenwoche, t => t.oberthema)
    themenWochen: Themenwoche[];

    @ManyToMany(type => Challenge)
    @JoinTable()
    spareChallenges: Challenge[];

    @ManyToOne(type => Props)
    props: Props
}