import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "text"})
    endpoint: string;

    @Column()
    auth: string;

    @Column()
    p256dh: string;

    public static build(endpoint: string, auth: string, p256dh: string): Object {
        return {
            endpoint: endpoint,
            keys: {
                auth: auth,
                p256dh: p256dh
            }
        }
    }
}