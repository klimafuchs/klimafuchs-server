import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn} from "typeorm";

@Entity()
export class Props {
    @PrimaryColumn()
    pageid: number;

    @Column()
    revid: number;

    @Column()
    parentid: number;

    @Column()
    user: string;

    @Column()
    timestamp: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}