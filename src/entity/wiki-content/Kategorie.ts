import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Oberthema} from "./Oberthema";
import {Props} from "./Props";

@Entity()
export class Kategorie {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @JoinTable()
    @OneToMany(type => Oberthema, o => o.kategorie)
    oberthemen: Oberthema[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(type => Props)
    props: Props
}