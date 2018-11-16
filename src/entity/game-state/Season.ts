import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {SeasonPlan} from "./SeasonPlan";

@Entity()
export class Season {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    startDate: Date;

    @Column()
    seasonTitle: string;

    @OneToMany(type => SeasonPlan, sp => sp.season )
    seasonPlan: SeasonPlan[];


}