import {Request, Response, Router} from "express";
import * as TypeGraphQl from "type-graphql";
import {FeedPostResolver} from "../resolver/FeedPostResolver";
import * as expressGrpahQL from "express-graphql"
import {Context} from "../resolver/types/Context";

let router = Router();

const schema = TypeGraphQl.buildSchemaSync({
    resolvers: [FeedPostResolver]
})

router.use('/', expressGrpahQL({
    schema: schema,
    context: ({request}) => {
        return {
            user: request.user
        }
    },
    graphiql: true,
}));
export {router as FeedController} ;