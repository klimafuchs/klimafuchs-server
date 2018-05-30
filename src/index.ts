import "reflect-metadata";
import {createConnection} from "typeorm";
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


let config = require("../config.json");
let RedisStore = require("connect-redis")(session);
let express_handlebars = require("express-handlebars")({defaultLayout: 'layout'});
// let httpsOptions = { //TODO remove for production
//     key: fs.readFileSync(config.key),
//     cert: fs.readFileSync(config.cert)
// }

createConnection().then(async connection => {

    // create express app
    const app = express();
    // setup express app

    const logger = (request : Request, response : Response, done : Function) => {
        console.log("Got request to " + request.originalUrl);
        done()
    };

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
