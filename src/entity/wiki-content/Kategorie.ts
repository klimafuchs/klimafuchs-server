import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable, ManyToMany, ManyToOne,
    OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Oberthema} from "./Oberthema";
import {Props} from "./Props";
import {Challenge} from "./Challenge";
import {Themenwoche} from "./Themenwoche";

@Entity()
export class Kategorie {

    @PrimaryColumn()
    name: string;

    @OneToMany(type => Oberthema, o => o.kategorie)
    oberthemen: Oberthema[];

    @OneToMany(type => Themenwoche, t => t.kategorie)
    themenWochen: Themenwoche[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToMany(type => Challenge)
    @JoinTable()
    challenges: Challenge[];

    @ManyToOne(type => Props)
    props: Props;

    static fromWeekTemplate(templateValues: any): Kategorie {
        let kategorie = new Kategorie();
        kategorie.oberthemen = [];
        kategorie.challenges = [];
        kategorie.name = templateValues.Kategorie;
        return kategorie;
    }
}