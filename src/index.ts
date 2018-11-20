import "reflect-metadata";
import {createConnection, useContainer} from "typeorm";
import * as TypeGraphQL from "type-graphql";
import {Container} from "typedi";
import {DateUtils} from "typeorm/util/DateUtils"
import * as express from "express";
import {Request, Response} from "express";
import * as bodyParser from "body-parser";
import * as passport from "passport";
import * as flash from "flash";
import {FrontEndController} from "./routes";
import * as session from "express-session";
import * as expressValidator from "express-validator";
import * as cookieParser from "cookie-parser";
import * as path from "path";
import {ApiContoller} from "./controller/ApiController";
import {passportConf} from "./PassportConfig";
import {ApiLandingContoller} from "./controller/ApiLandingController";
import * as cors from 'cors';
import * as schedule from 'node-schedule';
import {Challenge} from "./entity/wiki-content/Challenge";
import {Tasks} from "./tasks";
import {PushController} from "./controller/PushController";
import {FeedController} from "./controller/GqlController";
import * as serveIndex from "serve-index";
import {WikiSyncController} from "./controller/WikiSyncController";

let config = require("../config.json");
let RedisStore = require("connect-redis")(session);
let express_handlebars = require("express-handlebars")({defaultLayout: 'layout'});
// let httpsOptions = { //TODO remove for production
//     key: fs.readFileSync(config.key),
//     cert: fs.readFileSync(config.cert)
// }



useContainer(Container);
TypeGraphQL.useContainer(Container);
createConnection().then(async connection => {
    // init cron-like tasks
    const tasks = Container.get(Tasks);

    // create express app
    const app = express();

    // setup express app
    const logger = (request : Request, response : Response, done : Function) => {
        console.log("Got request to " + request.originalUrl);
        done()
    };
    app.use(cors());
    app.options('*', cors());

   app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });


    app.use(logger);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    //
    app.use(session({
        secret: process.env.SECRET || config.secret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: !config.dev }
    }));
    app.use(flash());
    app.use(passportConf);
    app.use(passport.session());
    app.use(expressValidator());

    try {
        app.use('/api/push', PushController);
        app.use('/api/', ApiLandingContoller);
        app.use('/api/auth', passport.authenticate('jwt', {session: false}), ApiContoller);
        app.use('/api/sync', WikiSyncController);
        app.use('/giql', passport.authenticate('basic', {session: false}), FeedController);
        //app.use('/giql', FeedController);

        app.use('/api/gql', passport.authenticate('jwt', {session: false}), FeedController);
    } catch (e) {
        console.error(e);
        process.exit(-1);
    }
    // setup static assets
    // TODO replace with something less homebrew
    app.use('/img',(req,res) => {
        const filepath = path.join(__dirname, '..','img', req.url);
        console.log("GET " +filepath);
        res.sendFile(filepath, (err) => {
            console.log(err);
            res.status(404);
            res.sendFile(path.join(__dirname, '..','img', 'default.png'));
        });
    });
    app.enable('view cache');

    // start express server
    let listener = app.listen(config.port || 3000);

  //https.createServer(httpsOptions, app).listen(config.port || 443);

    console.log(`Express server has started on port ${listener.address().port}. Open http://localhost:${listener.address().port}/giql to see results`);


}).catch(error => console.log(error));
