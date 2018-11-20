import {Arg, Authorized, Ctx, Mutation, Resolver} from "type-graphql";
import {Role} from "../entity/user/User";
import {Container} from "typedi";
import {WikiClient} from "../wikiData/WikiClient";


@Resolver()
export class AdminActionResolver {

    private wikiClient = Container.get(WikiClient);

    @Authorized("ADMIN")
    @Mutation(returns => String)
    public async syncWikiData(@Ctx() {user}): Promise<String> {
        return this.wikiClient.syncAllPages()
            .then(() => {return "success"})
            .catch((e) => {
                console.error(e);
                return e.message;
            });
    }

    @Authorized("ADMIN")
    @Mutation(returns => String)
    public async syncWikiPage(@Ctx() {user}, @Arg("pageId") pageId: number): Promise<String> {
        return this.wikiClient.syncPage(pageId)
            .then(() => {return "success"})
            .catch((e) => {
                console.error(e);
                return e.message;
            });
    }
}