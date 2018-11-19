import {BeforeInsert, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {SeasonPlan} from "./SeasonPlan";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Season {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Date)
    @Column({default: Date.now()})
    startDate: Date;

    @Field(type => Date)
    @Column({default: new Date()})
    startOffsetDate: Date;

    @Field(type => Date)
    @Column({default: Date.now()})
    endDate: Date;

    @Field(type => String)
    @Column()
    title: string;

    @Field(type => [SeasonPlan])
    @OneToMany(type => SeasonPlan, sp => sp.season, {eager: true})
    seasonPlan: SeasonPlan[];

    @BeforeInsert()
    private checkLength() {
        if( this.endDate < this.startDate) {
            console.error("Durations are usually positive!")
        }
    }

}