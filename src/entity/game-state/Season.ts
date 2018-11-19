import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
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

    @Field(type => String)
    @Column()
    seasonTitle: string;

    @Field(type => [SeasonPlan])
    @OneToMany(type => SeasonPlan, sp => sp.season, {eager: true})
    seasonPlan: SeasonPlan[];


}