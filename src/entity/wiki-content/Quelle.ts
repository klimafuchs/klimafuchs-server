import {Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import * as getTitleAtUrl from "get-title-at-url";

@Entity()
export class Quelle {

    @PrimaryGeneratedColumn()
    id: number;

    // don't use url as pk as  max text length > max key length
    @Column()
    public url: string;

    @Column()
    public title: string;

    @CreateDateColumn()
    createdAt: Date;

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