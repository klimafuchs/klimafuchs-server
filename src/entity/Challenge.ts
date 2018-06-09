import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Group} from "./Group";
import {Member} from "./Member";


@Entity()
export class Challenge {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({type: "text"})
    description: string;

    @Column({ type: "text", nullable: true })
    tip: string;

    @Column({ nullable: true })
    tested: string;

    @Column({ nullable: true })
    difficulty: string;

    @Column({ nullable: true })
    effort: string;

    @Column({ nullable: true })
    duration: string;

    @Column({ nullable: true })
    fun: string;

    @Column({ nullable: true })
    season: string;

    @Column({ nullable: true })
    region: string;

    @Column({ nullable: true })
    co2_savings: string;

    @Column({ nullable: true })
    score: number;

    @Column({ type: "text",  nullable: true })
    sources: string;

    @Column({ type: "text", nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @Column()
    active: boolean;

    @ManyToMany(type => Member, member => member.challengesCompleted)
    completedBy: Member[];

    public getClientData() {
        let o;
        o =   {
            id : this.id,
            title : this.title,
            description: this.description,
            score: this.score,
            tip : this.tip,
            active : this.active,
            imageUrl: this.imageUrl,
            sources: this.sources,
            startDate: this.startDate,
            endDate: this.endDate,
            co2: this.co2_savings
        }
        return o;
    }
}
