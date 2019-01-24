import {Arg, Ctx, Mutation, Query, Resolver} from "type-graphql"
import {Repository} from "typeorm";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Context} from "./types/Context";
import {GraphQLUpload, Upload} from "apollo-upload-server";
import {Media} from "../entity/Media";
import {generate} from "shortid";
import * as fs from "fs";

interface FileInsert {
    newName: string,
    path: string
}

@Resolver(Media)
export class MediaResolver {
    private static uploadDir: string = './img';

    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>
    ) {
    }

    private static storeFile(stream, filename): Promise<FileInsert> {
        const id = generate();
        const newName = `${id}-${filename}`;
        const path = `${MediaResolver.uploadDir}/${newName}`;
        return new Promise(((resolve, reject) =>
                stream.on('error', err => {
                    if (stream.truncated) fs.unlinkSync(path);
                    reject(err);
                }).pipe(fs.createWriteStream(path))
                    .on('error', err => reject(err))
                    .on('finish', () => resolve({path: path, newName: newName}))
        ))
    }

    @Query(returns => [Media])
    async myMedia(@Ctx() {user}): Promise<Media[]> {
        return this.mediaRepository.find({where: {uploader: user}})
    }

    @Mutation(returns => Media)
    async upload(@Arg('file', type => GraphQLUpload) file: Upload, @Ctx() {user}: Context): Promise<Media> {
        const {stream, filename, mimetype, encoding, width, height} = await file;
        console.log(`Receiving file: \n ${{filename: filename, mimetype: mimetype, encoding: encoding, height, width}}`)
        const {path, newName} = await MediaResolver.storeFile(stream, filename);
        const media = this.mediaRepository.create({
            filename: newName,
            mimetype: mimetype,
            encoding: encoding,
            path: path,
            uploader: user,
            width: width,
            height: height
        });
        return this.mediaRepository.save(media);
    }
}