import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
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

    @PrimaryColumn()
    title: string;

    @Column({type: "text"})
    content: string;

    @ManyToOne(type => WikiImage)
    headerImage: WikiImage;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Oberthema)
    @ManyToOne(type => Oberthema, o => o.themenWochen)
    oberthema: Oberthema;

    @Field(type => Kategorie)
    @ManyToOne(type => Kategorie, k => k.themenWochen)
    kategorie: Kategorie;

    @Field(type => [Challenge])
    @ManyToMany(type => Challenge, c => c.themenWoche)
    @JoinTable()
    challenges: Challenge[];

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Props;

    @Field(type => Quelle)
    @ManyToMany(type => Quelle)
    @JoinTable()
    quellen: Quelle[];

    @Field(type => [SeasonPlan])
    @ManyToMany(type => SeasonPlan, s => s.themenwoche)
    @JoinTable()
    usages: SeasonPlan[];

    static fromTemplate(templateValues: any) {
        let themenWoche = new Themenwoche();
        themenWoche.title = templateValues.Titel;
        themenWoche.content = templateValues.Beschreibung;
        return themenWoche;
    }
}