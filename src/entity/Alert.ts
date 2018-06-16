import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Alert {

    @PrimaryGeneratedColumn()
    id;

    @Column()
    shouldSend: boolean = false;

    @Column()
    message: string;

    @Column()
    icon: string;

    @Column()
    url: string;

}