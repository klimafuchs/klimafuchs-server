import {AfterLoad, BeforeInsert, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {SeasonPlan} from "./SeasonPlan";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Season {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Date)
    @Column()
    startDate: Date;

    @Field(type => Date)
    @Column()
    startOffsetDate: Date;

    @Field(type => Date)
    @Column()
    endDate: Date;

    @Field(type => String)
    @Column()
    title: string;

    @Field(type => [SeasonPlan])
    @OneToMany(type => SeasonPlan, sp => sp.season, {eager: true})
    seasonPlan: SeasonPlan[];

    @BeforeInsert()
    private fixThings() {
        this.startDate = this.startDate || new Date(Date.now());
        this.endDate = this.endDate || new Date(Date.now());
        this.startOffsetDate = this.startOffsetDate ||  new Date();
        if( this.endDate < this.startDate) {
            console.error("Durations are usually positive!")
        }
    }

    @AfterLoad()
    private sortSeasonPlans() {
        this.seasonPlan = this.seasonPlan.sort((a,b) => a.position - b.position)
    }


}