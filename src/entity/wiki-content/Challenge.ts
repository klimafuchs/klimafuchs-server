import {
    Column,
    CreateDateColumn,
    Entity, JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Themenwoche} from "./Themenwoche";
import {Props} from "./Props";
import {Kategorie} from "./Kategorie";
import {Oberthema} from "./Oberthema";
import {Field, Int, ObjectType} from "type-graphql";
import {Media} from "../Media";
import {WikiImage} from "./WikiImage";

@Entity()
@ObjectType()
export class Challenge {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    title: string;

    @Field(type => String)
    @Column({type: "text"})
    content: string;

    @Field(type => String, {nullable: true})
    @Column({ type: "text", nullable: true })
    tip?: string;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    score?: number;

    @Field(type => Boolean)
    @Column()
    isSpare: boolean;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Themenwoche)
    @ManyToOne(type => Themenwoche, t => t.challenges, {nullable: true})
    themenWoche: Promise<Themenwoche>;

    @Field(type => Kategorie)
    @ManyToOne(type => Kategorie, k => k.challenges)
    kategorie: Promise<Kategorie>;

    @Field(type => Oberthema)
    @ManyToOne(type => Oberthema, o => o.challenges)
    oberthema: Promise<Oberthema>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    @Field(type => WikiImage, {nullable: true})
    @ManyToOne(type => WikiImage)
    headerImage: Promise<WikiImage>;

    headerImageUrl?: string;

    static fromTemplate(challengeTemplate): Challenge {
        let challenge = new Challenge();
        challenge.title = challengeTemplate.Name;
        challenge.content = challengeTemplate.Text;
        challenge.score = challengeTemplate.Ersparnis || 2;
        challenge.isSpare = !!challengeTemplate.Ersatzchallenge || false;
        challenge.headerImageUrl = challengeTemplate.HeaderImage || null;
        return challenge;
    }
}
