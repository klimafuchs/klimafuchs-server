import {Entity, PrimaryGeneratedColumn} from "typeorm";
import {ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class SeasonPlanChallenge {

    @PrimaryGeneratedColumn()
    id: number;

}