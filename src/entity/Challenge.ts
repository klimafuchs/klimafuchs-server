import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Challenge {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    imageUrl: string;

    @Column()
    description: string;

    @Column()
    startDate: Date;

    @Column()
    endDate: Date;


}
