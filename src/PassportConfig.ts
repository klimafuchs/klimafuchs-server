import {User} from "./entity/User";
import {getRepository} from "typeorm";
import * as passportLocal from "passport-local";
import * as passportJwt from "passport-jwt";
import * as passport from "passport";

const config = require("../config.json");

const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;
const p = passport.initialize();

passport.serializeUser<any, any>((user, done) => {
    done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
    getRepository(User).findOne(id).then((user) => {
        if(user == undefined) done(null,null);
        done(null, user);
    });
});

passport.use( new LocalStrategy ( {
        usernameField: 'username',
        passwordField: 'password'
    },
    (username: string, password: string, done: Function) => {
        getRepository(User).findOne({userName: username}).then(user => {
            if(user == null) {
                return done(undefined, null, {message: "Email not found"});
            }
            if(user.validatePassword(password)) return done(undefined, user);
            return done(undefined, null, {message: "Invalid password!"});

        })
    }
));

passport.use( new JwtStrategy ( {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.API_SECRET || config.tokenSecret
    }, (jwtPayload, done: Function) => {
        getRepository(User).findOne({id: jwtPayload}).then(user => {
            return done(null,user);
        }).catch(err => {
            return done(err);
        })
    }
));

export {p as passportConf};