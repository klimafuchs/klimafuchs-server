import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity, ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Season} from "./Season";
import {Themenwoche} from "../wiki-content/Themenwoche";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class SeasonPlan {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Season)
    @ManyToOne(type => Season, s => s.seasonPlan)
    season: Season;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Date)
    @Column()
    startDate: Date;

    @Field(type => Int)
    @Column()
    duration: number;

    @BeforeInsert()
    public setDefaultDuration() {
        if (!this.duration || this.duration < 1) {
            let config = require("../config.json");
            this.duration = config.defaultWeekDuration || 7 * 24 * 60 * 60 // s per week
        }
    }

    @Field(type => Themenwoche)
    @ManyToMany(type => Themenwoche, t => t.usages, {eager: true})
    themenwoche: Themenwoche
}