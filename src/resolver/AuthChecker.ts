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

    switch (user.role) {
        case Role.Admin:
            return roles.includes("ADMIN");
        case Role.User:
            return roles.includes("USER");
        default:
            return false;
    }
}