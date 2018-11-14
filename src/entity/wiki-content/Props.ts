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

    public static create(wikiProps): Props {

        let props = new Props();

        return props;

    }

}