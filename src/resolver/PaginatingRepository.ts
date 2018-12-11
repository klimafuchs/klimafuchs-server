import {EntityRepository, FindConditions, Repository} from "typeorm";
import {ConnectionArgs} from "./types/ConnectionPaging";
import {connectionFromArraySlice} from "graphql-relay";

export class PaginatingRepository<T> extends Repository<T> {
        async findAndPaginate(conditions: FindConditions<T>, connArgs: ConnectionArgs) {
        const {limit, offset} = connArgs.pagingParams();
        const [entities, count] = await this.findAndCount({
            where: conditions,
            skip: offset,
            take: limit,
        });
        const res = connectionFromArraySlice(entities, connArgs, {arrayLength: count, sliceStart: offset || 0});
        return {
            res,
            pageInfo: {
                count,
                limit,
                offset,
            }
        }
    }
}

export function Paginates() {

}