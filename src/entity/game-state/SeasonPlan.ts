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

@Entity()
export class SeasonPlan {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Season, s => s.seasonPlan)
    season: Season;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    startDate: Date;

    @Column()
    duration: number;

    @BeforeInsert()
    public setDefaultDuration() {
        if (!this.duration || this.duration < 1) {
            let config = require("../config.json");
            this.duration = config.defaultWeekDuration || 7 * 24 * 60 * 60 // s per week
        }
    }

    @ManyToMany(type => Themenwoche, t => t.usages)
    themenwoche: Themenwoche
}