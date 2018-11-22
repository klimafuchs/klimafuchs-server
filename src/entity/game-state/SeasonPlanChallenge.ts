import {Entity, PrimaryGeneratedColumn} from "typeorm";
import {ObjectType} from "type-graphql";

@Entity()
export class SeasonPlanChallenge {

    @PrimaryGeneratedColumn()
    id: number;

}