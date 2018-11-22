import {
    BeforeInsert,
    Column,
    Entity,
    getRepository,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    ManyToOne
} from "typeorm";
import {User} from "../user/User";
import {Challenge} from "../wiki-content/Challenge";
import {Member} from "./Member";

@Entity()
export class Group {


    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string = "placeholder";

    @ManyToMany(type => Member, member => member.group, {eager: true})
    @JoinTable()
    members: Member[];

}
