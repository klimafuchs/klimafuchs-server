import {AuthChecker} from "type-graphql";
import {Context} from "./types/Context";
import {Role} from "../entity/User";

export const authChecker: AuthChecker<Context> = ({context: {user}}, roles) => {
    if(!user) {
        console.log("User not in context")
        return false
    }

    if(roles.length === 0) {
        return user !== undefined;
    }

    switch (user.role) { // TODO replace role ints with strings to make this less awkward
        case Role.Admin:
            return roles.filter((str) => str === "ADMIN").length == 1;
        case Role.User:
            return roles.filter((str) => str === "USER").length == 1;
        default:
            return false;
    }
}