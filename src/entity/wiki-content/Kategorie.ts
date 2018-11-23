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
    oberthemen: Oberthema[];

    @Field(type => [Themenwoche])
    @OneToMany(type => Themenwoche, t => t.kategorie)
    themenWochen: Themenwoche[];

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => [Challenge])
    @ManyToMany(type => Challenge, {eager: true})
    @JoinTable()
    challenges: Challenge[];

    @Field(type => Props)
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