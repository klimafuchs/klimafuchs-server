import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable, ManyToMany, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Oberthema} from "./Oberthema";
import {Props} from "./Props";
import {Challenge} from "./Challenge";

@Entity()
export class Kategorie {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Oberthema, o => o.kategorie)
    oberthemen: Oberthema[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToMany(type => Challenge)
    @JoinTable()
    spareChallenges: Challenge[];

    @ManyToOne(type => Props)
    props: Props
}