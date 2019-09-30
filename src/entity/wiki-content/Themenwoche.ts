import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn
} from "typeorm";
import {Quelle} from "./Quelle";
import {Oberthema} from "./Oberthema";
import {Challenge} from "./Challenge";
import {Props} from "./Props";
import {WikiImage} from "./WikiImage";
import {Kategorie} from "./Kategorie";
import {SeasonPlan} from "../game-state/SeasonPlan";
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Themenwoche{

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    title: string;

    @Field(type => String)
    @Column({type: "text"})
    content: string;

    @Field(type => WikiImage, {nullable: true})
    @ManyToOne(type => WikiImage, {eager: true})
    headerImage: WikiImage;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Oberthema, {nullable: true})
    @ManyToOne(type => Oberthema, o => o.themenWochen, {cascade: true})
    oberthema: Promise<Oberthema>;

    @Field(type => Kategorie, {nullable: true})
    @ManyToOne(type => Kategorie, k => k.themenWochen,{cascade: true})
    kategorie: Promise<Kategorie>;

    @Field(type => [Challenge], {nullable: true})
    @OneToMany(type => Challenge, c => c.themenWoche,{cascade: true})
    @JoinTable()
    challenges: Promise<Challenge[]>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    @Field(type => Quelle, {nullable: true})
    @ManyToMany(type => Quelle)
    @JoinTable()
    quellen: Promise<Quelle[]>;

    @Field(type => [SeasonPlan], {nullable: true})
    @OneToMany(type => SeasonPlan, s => s.themenwoche)
    usages: Promise<SeasonPlan[]>;

    static fromTemplate(templateValues: any) {
        let themenWoche = new Themenwoche();
        themenWoche.title = templateValues.Titel;
        themenWoche.content = templateValues.Beschreibung;
        return themenWoche;
    }
}