// @see https://github.com/19majkel94/type-graphql/issues/142
// TODO use this instead of hard coded Types
import {ReturnTypeFuncValue, TypeValue} from "type-graphql/decorators/types";
import * as Relay from 'graphql-relay'
import {Field, ObjectType} from "type-graphql";
import {PageData} from "../PaginatingRepository";

export function connectionTypes<T extends TypeValue>(name: String, nodeType: T): ReturnTypeFuncValue {
    @ObjectType(`${name}Edge`)
    class Edge implements Relay.Edge<T> {

        @Field()
        cursor!: Relay.ConnectionCursor;

        @Field(type => nodeType)
        node!: T;

        @Field(type => String)
        cursorDecoded() {
            return Relay.fromGlobalId(this.cursor)
        }
    }

    @ObjectType(`${name}Connection`)
    class Connection implements Relay.Connection<T> {
        @Field(type => Edge)
        edges!: Relay.Edge<T>[];

        @Field(type => [Edge])
        pageInfo!: Relay.PageInfo;
    }

    @ObjectType(`${name}Page`)
    class Page {
        @Field(type => Connection)
        page!: Connection;

        @Field(type => PageData)
        pageData!: PageData;
    }

    return Page;
}