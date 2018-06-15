import "reflect-metadata";
import {createConnection, getRepository, LessThan, MoreThan} from "typeorm";
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
import {Challenge} from "./entity/Challenge";
import {Tasks} from "./tasks";
import {PushController} from "./controller/PushController";

let config = require("../config.json");
let RedisStore = require("connect-redis")(session);
let express_handlebars = require("express-handlebars")({defaultLayout: 'layout'});
// let httpsOptions = { //TODO remove for production
//     key: fs.readFileSync(config.key),
//     cert: fs.readFileSync(config.cert)
// }



createConnection().then(async connection => {


    // init cron-like tasks
    const tasks = new Tasks();

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

    app.use('/api/push', PushController);
    app.use('/api/', ApiLandingContoller);
    app.use('/api/auth', passport.authenticate('jwt', {session: false}), ApiContoller);

    //setup views
    app.set('views', path.join(__dirname, 'views'));
    app.engine('handlebars', express_handlebars);
    app.set('view engine', 'handlebars');

    //setup static assets
    app.use(express.static('public'));

    app.enable('view cache');

    // start express server
    app.listen(config.port);

  //https.createServer(httpsOptions, app).listen(config.port || 443);


    console.log("Express server has started on port 3000. Open http://localhost:3000/users to see results");

    app._router.stack.forEach(function(r){
        if (r.route && r.route.path){
            console.log(r.route.path)
        }
    })


}).catch(error => console.log(error));
