import {Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import * as getTitleAtUrl from "get-title-at-url";
import {Field, Int, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Quelle {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    // don't use url as pk as  max text length > max key length
    @Field(type => String)
    @Column()
    public url: string;

    @Field(type => String)
    @Column()
    public title: string;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    public static create(url: string): Quelle {
        let q = new Quelle();
        q.url = url;
        try {
            q.title = getTitleAtUrl(url)
        } catch (e) {
            console.error(e.message);
            q.title = url;
        }
        return q;
    }
}