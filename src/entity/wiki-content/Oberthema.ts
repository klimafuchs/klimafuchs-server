import {
    Column,
    CreateDateColumn,
    Entity, JoinTable,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Kategorie} from "./Kategorie";
import {Themenwoche} from "./Themenwoche";
import {Props} from "./Props";

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

    @JoinTable()
    @ManyToOne(type => Kategorie, k => k.oberthemen)
    kategorie: Kategorie;

    @JoinTable()
    @OneToMany(type => Themenwoche, t => t.oberthema)
    themenWochen: Themenwoche[];

    @ManyToOne(type => Props)
    props: Props
}