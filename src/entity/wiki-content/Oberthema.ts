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
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Oberthema {

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    name: string;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Kategorie)
    @ManyToOne(type => Kategorie, k => k.oberthemen)
    kategorie: Promise<Kategorie>;

    @Field(type => [Themenwoche])
    @OneToMany(type => Themenwoche, t => t.oberthema)
    themenWochen: Promise<Themenwoche[]>;

    @Field(type => [Challenge])
    @ManyToMany(type => Challenge, c => c.oberthema, {eager: true})
    @JoinTable()
    challenges: Promise<Challenge[]>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    static fromWeekTemplate(templateValues: any) {
        let oberthema = new Oberthema();
        oberthema.name = templateValues.Oberthema;
        return oberthema;
    }
}