import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Props} from "./Props";

export enum WikiWarnings {
    NoTopic = "NoTopic",
    NoChallenges = "NoChallenges",
    NoSpareChallenges = "NoSpareChallenges",
    NotEnoughDefaultChallenges = "NotEnoughDefaultChallenges",
    TooManyDefaultChallenges = "TooManyDefaultChallenges",
    EmptyText = "EmptyText",
    NoHeaderImage = "NoHeaderImage",
    TemplateParsingError = "TemplateParsingError"
}

@Entity()
export class WikiWarning {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(type => Props, prop => prop.warnings)
    @JoinColumn()
    props: Props;

    @Column()
    warnings: string; // Simplicity > NF and TypeORMs non existent set support TODO make less broken

    static fromWarnings(warnings: WikiWarnings[]): WikiWarning {
        let wikiWarning = new WikiWarning();
        wikiWarning.warnings = warnings.map((w) => w.toString()).join('|');
        return wikiWarning;
    }

    private compact(arr) {
        return arr.map((w) => w.toString()).join('|');
    }

    public push(warning: WikiWarnings) {
        this.warnings = this.compact(this.toArray().push(warning))
    }

    public toArray() {
        return this.warnings.split('|');
    }

}