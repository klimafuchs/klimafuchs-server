import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn} from "typeorm";

export interface WikiProps {
    pageid: number;
    revid: number;
    parentid: number;
    user: string;
    timestamp: Date;
}

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
        props.pageid = wikiProps.pageid;
        props.revid = wikiProps.revid;
        props.parentid = wikiProps.parentid;
        props.user = wikiProps.user;
        props.timestamp = wikiProps.timestamp;
        return props;
    }

}