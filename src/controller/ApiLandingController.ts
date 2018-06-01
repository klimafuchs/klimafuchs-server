import {Request, Response, Router} from "express";
import * as passport from "passport";
import {User} from "../entity/User";
import * as jwt from "jsonwebtoken";
import {Group} from "../entity/Group";
import {getRepository} from "typeorm";

let router = Router();
const config = require("../../config.json");

/**
 * @api {post} /api-login
 * @apiName Login
 * @apiGroup Client Login
 * @apiExample Example usage:
 POST http://enviroommate.org:3000/api/login
 Accept: application/json
 Cache-Control: no-cache
 Content-Type: application/json

 {"username" : "1@test.com", "password":"test"}

 res: {"id":3,"token":"eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4"}
 */
router.post('/login', passport.authenticate('local', {session: false}), (req: Request, res: Response, done: Function) => {
    if (!req.user) {
        res.status = 401;
        done(res.json({message: "No such user!"}));
    }
    const id = req.user.id;
    const token = jwt.sign(id, config.tokenSecret);
    done(res.json({id, token}));
});


router.post('/register', (request: Request, response: Response, done: Function) => {
    //validate
    request.checkBody('username', 'Email is required').notEmpty();
    request.checkBody('username', 'Email is not valid').isEmail();
    request.checkBody('screenname', 'Username is required').notEmpty();
    request.checkBody('password', 'Password is required').notEmpty();
    request.checkBody('confirm_password', 'Passwords do not match').equals(request.body.password);

    let err = request.validationErrors();
    if (err) {
        response.status = 400;
        done(response.json({message: "Something went wrong :(", error: err}));
    }

    //get form data
    let username = request.body.username;
    let screenname = request.body.screenname;
    let password = request.body.password;
    let confirmPassword = request.body.confirm_password;
    let inviteLink = request.body.invite;

    getRepository(User).findOne({userName: username}).then((user) => {
        if (user == null) {
            let newUser = new User();
            newUser.userName = username;
            newUser.screenName = screenname;
            newUser.password = password;
            if (inviteLink != null) {
                getRepository(Group).findOne({inviteId: inviteLink}).then((group) => {
                    newUser.group = group;
                })
            }
            getRepository(User).insert(newUser);
            done(response.json(newUser.transfer(true)));
        } else {
            response.status = 400;
            done(response.json({message: "Username already taken"}));
        }
    })
});

export {router as ApiLandingContoller} ;