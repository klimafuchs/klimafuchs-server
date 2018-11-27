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
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Kategorie {

    @Field(type => String)
    @PrimaryColumn()
    name: string;

    @Field(type => [Oberthema])
    @OneToMany(type => Oberthema, o => o.kategorie, {eager: true})
    oberthemen: Promise<Oberthema[]>;

    @Field(type => [Themenwoche])
    @OneToMany(type => Themenwoche, t => t.kategorie)
    themenWochen: Promise<Themenwoche[]>;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => [Challenge])
    @ManyToMany(type => Challenge, {eager: true})
    @JoinTable()
    challenges: Promise<Challenge[]>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    static fromWeekTemplate(templateValues: any): Kategorie {
        let kategorie = new Kategorie();
        kategorie.oberthemen = Promise.resolve([]);
        kategorie.challenges = Promise.resolve([]);
        kategorie.name = templateValues.Kategorie;
        return kategorie;
    }
}