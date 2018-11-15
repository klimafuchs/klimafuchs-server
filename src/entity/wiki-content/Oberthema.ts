import {
    Column,
    CreateDateColumn,
    Entity, JoinTable, ManyToMany,
    ManyToOne,
    OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Kategorie} from "./Kategorie";
import {Themenwoche} from "./Themenwoche";
import {Props} from "./Props";
import {Challenge} from "./Challenge";

@Entity()
export class Oberthema {

    @PrimaryColumn()
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(type => Kategorie, k => k.oberthemen)
    kategorie: Kategorie;

    @OneToMany(type => Themenwoche, t => t.oberthema)
    themenWochen: Themenwoche[];

    @ManyToMany(type => Challenge, c => c.oberthema)
    @JoinTable()
    challenges: Challenge[];

    @ManyToOne(type => Props)
    props: Props

    static fromWeekTemplate(templateValues: any) {
        let oberthema = new Oberthema();
        oberthema.themenWochen = [];
        oberthema.name = templateValues.Oberthema;
        return oberthema;
    }
}