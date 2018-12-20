import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Season} from "./Season";
import {Themenwoche} from "../wiki-content/Themenwoche";
import {Field, Int, ObjectType} from "type-graphql";
import {SeasonPlanChallenge} from "./SeasonPlanChallenge";

@Entity()
@ObjectType()
export class SeasonPlan {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Season)
    @ManyToOne(type => Season, s => s.seasonPlan)
    season: Promise<Season>;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Int)
    @Column()
    duration: number;

    @Field(type => Int)
    @Column({default: 0})
    position: number;

    @BeforeInsert()
    public setDefaultDuration() {
        console.log(this);
        if (!this.duration || this.duration < 1) {
            let config = require("../../../config.json"); //todo replace with container var
            this.duration = config.defaultWeekDuration || 7 * 24 * 60 * 60 // s per week
        }
    }

    @Field(type => Themenwoche)
    @ManyToOne(type => Themenwoche, t => t.usages)
    themenwoche: Promise<Themenwoche>;

    @Field(type => [SeasonPlanChallenge])
    @OneToMany(type => SeasonPlanChallenge, s => s.plan, {cascade: ["remove"]})
    challenges: Promise<SeasonPlanChallenge[]>;
}