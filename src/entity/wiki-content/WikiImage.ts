import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {Props} from "./Props";

@Entity()
export class WikiImage {

    @Column()
    mimetype: string;

    @Column()
    url: string;

    @Column()
    uploader: string;

    @Column()
    timestamp: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    details: string;

    @PrimaryColumn()
    canonicalName: string;

    @ManyToOne(type => Props)
    props: Props

    static fromRequest(query): WikiImage {
        const queryResult = query.data.query;
        console.log(queryResult.pages[queryResult.pageids[0]]);
        const {title: canonicalName, imageinfo: [imageinfo], revisions: [revisions]} = queryResult.pages[queryResult.pageids[0]];
        let wikiImage = new WikiImage();
        wikiImage.canonicalName = canonicalName;
        wikiImage.uploader = imageinfo.user;
        wikiImage.timestamp = imageinfo.timestamp;
        wikiImage.url = imageinfo.url;
        wikiImage.mimetype = imageinfo.mime;
        wikiImage.details = revisions['*'];
        return wikiImage;
    }
}