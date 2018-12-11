// @see https://github.com/19majkel94/type-graphql/issues/142
import {TypeValue} from "type-graphql/decorators/types";
import * as Relay from 'graphql-relay'
import {Field, ObjectType} from "type-graphql";

export function connectionTypes<T extends TypeValue>(name: String, nodeType:T){
    @ObjectType(`${name}Edge`)
    class Edge implements Relay.Edge<T> {

        @Field()
        cursor!: Relay.ConnectionCursor;

        @Field(type => nodeType)
        node!: T;

        @Field(type => JSON)
        cursorDecoded() {
            return Relay.fromGlobalId(this.cursor)
        }
    }

    @ObjectType(`${name}Connection`)
    class Connection implements Relay.Connection<T> {
        @Field()
        edges!: Edge[];

        @Field(type => [Edge])
        pageInfo!: Relay.PageInfo;

    }

    return {
        Connection,
        Edge
    }
}