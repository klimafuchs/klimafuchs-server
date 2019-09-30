import {Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {WikiWarning} from "./WikiWarning";
import {Field, Int, ObjectType} from "type-graphql";

export interface WikiProps {
    pageid: number;
    revid: number;
    parentid: number;
    user: string;
    timestamp: Date;
}

@Entity()
@ObjectType()
export class Props {
    @Field(type => Int)
    @PrimaryColumn()
    pageid: number;

    @Field(type => Int)
    @Column()
    revid: number;

    @Field(type => Int)
    @Column()
    parentid: number;

    @Field(type => String)
    @Column()
    user: string;

    @Field(type => Date)
    @Column()
    timestamp: Date;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => WikiWarning)
    @OneToOne(type => WikiWarning, warning => warning.props, {eager: true})
    warnings: WikiWarning;

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