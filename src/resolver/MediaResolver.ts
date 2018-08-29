import {Arg, Ctx, Mutation, Resolver} from "type-graphql"
import {Repository} from "typeorm";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Context} from "./types/Context";
import {GraphQLUpload, Upload} from "apollo-upload-server";
import {Media} from "../entity/Media";
import {generate} from "shortid";
import * as fs from "fs";

@Resolver(Media)
export class MediaResolver {
    private static uploadDir: './img';

    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
    ) {
    }

    private static storeFile(stream, filename) {
        const id = generate();
        const path = `${this.uploadDir}/${id}-${filename}`;
        return new Promise(((resolve, reject) =>
                stream.on('error', err => {
                    if (stream.truncated) fs.unlinkSync(path)
                    reject(err);
                }).pipe(fs.createWriteStream(path))
                    .on('error', err => reject(err))
                    .on('finish', () => resolve(path))
        ))
    }

    @Mutation(returns => Media)
    async upload(@Arg('file', type => GraphQLUpload) file: Upload, @Ctx() {user}: Context): Promise<Media> {
        const {stream, filename, mimetype, encoding} = await file;
        const path = await MediaResolver.storeFile(stream, filename);
        const media = this.mediaRepository.create({
            filename: filename,
            mimetype: mimetype,
            encoding: encoding,
            path: path,
            uploader: user
        });
        return this.mediaRepository.save(media);
    }
}