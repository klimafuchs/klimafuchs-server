import {Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import * as getTitleAtUrl from "get-title-at-url";

@Entity()
export class Quelle {

    @PrimaryColumn()
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