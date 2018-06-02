import {Router, Request, Response} from "express";
import {getRepository, Like} from "typeorm";
import {Group} from "../entity/Group";
import {User} from "../entity/User";
import * as bodyParser from "body-parser"
import * as Url from "url";
import * as QueryString from "querystring";
import {query} from "express-validator/check";
import {Challenge} from "../entity/Challenge";

let router = Router();

async function loadRelations(user: User): Promise<User> {
    let u = await getRepository(User).findOne({where: {id: user.id}, relations: ["group"]});
    if (!u) throw new Error("no such user");
    return u;
}

function sendServerError (response: Response) {

    console.log(JSON.stringify(response));
    response.status = 500;
    response.json({message: "Internal Server error"});

    return(response);
}

/**
 * @api {get}/api/auth/profile Get Profile
 * @apiName Profile
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} user The currently logged in users data
 * @apiError {String} message The error
 * @apiDescription Gets the user data of the logged in user. Authorization via bearer token
 * @apiExample {curl} Example usage of bearer token:
 GET http://enviroommate.org:3000/api/profile
 Accept: application/json
 Cache-Control: no-cache
 Content-Type: application/json
 Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4

 res: {"id":3,"userName":"1@test.com","screenName":"test","dateCreated":"2018-05-25T20:28:11.000Z","emailConfirmed":false,"isBanned":false,"group":""}
 */
router.use(bodyParser.json());
router.get("/profile", (request: Request, response: Response, done: Function) => {
    done(response.json(((request.user) as User).transfer(true)));
});

/**
 * @api {get} /api/auth/wg Get WG
 * @apiName WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users group
 * @apiError {String} message The error
 */
router.get("/wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(u => {
        if (u.group) {
            done(response.json(u.group.transfer(true)));
        } else {
            response.status = 400;
            response.json({message: "Group not found"});
            done(response)
        }
    }).catch(done(sendServerError));
});

/**
 * @api {post} /api/auth/new-wg New WG
 * @apiName New WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users newly created group
 * @apiError {String} message The error
 * @apiDescription Lets users who are currently not in a group create a new one.
 */
router.post("/new-wg", (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(u => {
        if (u.group) {
            response.status = 400;
            done(response.json({message: "already in a group"}));
        } else {
            let newGroup = new Group();
            newGroup.members = [request.user];
            getRepository(Group).save(newGroup).then((g) => {
                if (g == null) {
                    response.status = 500;
                    response.json({message: "Group not created"});
                    done(response)
                } else {
                    response.json(g.transfer(true));
                    done(response)
                }
            }).catch(done(sendServerError));
        }
    }).catch(done(sendServerError));


});

/**
 * @api {post} /api/auth/update-wg Update WG
 * @apiName Update WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users updated group
 * @apiError {String} message The error
 * @apiDescription Lets users change the display name of their group.
 * @apiParam {String} newName Sets the groups name
 */
router.post("/update-wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(u => {
        if (u.group) {
            u.group.name = request.body.newName;
            getRepository(Group).save(u.group).then((g) => {
                if (g == null) {
                    response.status = 400;
                    response.json({message: "Group not found"});
                    done(response)
                } else {
                    response.json(g.transfer(true));
                    done(response)
                }
            }).catch(done(sendServerError));
        } else {
            response.status = 400;
            response.json({message: "Group not found"});
            done(response)
        }
    }).catch(done(sendServerError));
});

/**
 * @api {post} /api/auth/join-wg Join WG
 * @apiName Join WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users new Group
 * @apiError {String} message The error
 * @apiDescription Lets users join a group they have the invite link of.
 * @apiParam {String} inviteId Join group with this invite link
 */
router.post("/join-wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(u => {

        if (u.group != null) {
            response.status = 400;
            response.json({message: "already in a group"});
            done(response)
        }

        getRepository(Group).findOne({inviteId: request.body.inviteLink}).then(async g => {
            if (g == null) {
                response.status = 400;
                response.json({message: "Invalid invite link"});
                done(response)
            } else {
                u.group = g;
                await getRepository(User).save(u);
                let updated = await getRepository(Group).findOne({id: g.id});
                response.json(updated.transfer(true));
                done(response)
            }
        }).catch(done(sendServerError))
    }).catch(done(sendServerError));
});

/**
 * @api {post} /api/auth/leave-wg Leave WG
 * @apiName Leave WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {String} message
 * @apiError {String} message The error
 * @apiDescription Removes a user from a group.
 */
router.post("/leave-wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(async u => {
        if (u.group) {
            let g = u.group;
            g.members.splice(g.members.indexOf(u), 1);
            u.group = null;

            await getRepository(Group).save(g);
            u = await getRepository(User).save(u);
            response.json(u.transfer(true));
            done(response);
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));

        }
    }).catch(done(sendServerError));
});

/**
 * @api {get} /api/auth/search-wg Search Wg
 * @apiName Search WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object[]} groups Groups matching the query
 * @apiParam {String} query The search query
 * @apiError {String} message The error
 * @apiDescription Finds other groups to follow them
 */
router.get("/search-wg", (request: Request, response: Response, done: Function) => {
    let queryObject = QueryString.parse(Url.parse(request.url).query);
    let queryString: String = queryObject.query.toString();
    if (!queryObject.query) {
        response.status = 400;
        response.json({message: "No search query"});
        done(response)
    } else {
        getRepository(Group).find({name: Like(queryString + "")}).then(groups => {
            let accumulate = Array.from(groups).map(group => group.transfer(false))
            response.json(accumulate);
            done(response)
        }).catch(done(sendServerError))
    }
});

/**
 * @api {get} /api/auth/followed-wgs Followed WGs
 * @apiName Followed WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object[]} groups Groups the users group is following
 * @apiError {String} message The error
 */
router.get("/followed-wgs", (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(u => {
        if (u.group) {
            u.group.follows().then(groups => {
                let accumulate = Array.from(groups).map(group => group.transfer(false))
                response.json(accumulate);
                done(response)
            }).catch(response)
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));
        }
    }).catch(done(sendServerError))
});

/**
 * @api {post} /api/auth/follow-wg Follow WG
 * @apiName Follow WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiParam {id} id Follow the group with this id
 * @apiSuccess {Object} group The group the user is now following
 * @apiError {String} message The error
 */
router.post("/follow-wg", async (request: Request, response: Response, done: Function) => {
    let queryObject = QueryString.parse(Url.parse(request.url).query);
    let idString: String = queryObject.id.toString();
    console.log("queryString:" + idString);
    const groupToFollow = await getRepository(Group).findOne({where: {id: idString}});
    if (groupToFollow) {
        loadRelations(request.user).then(async u => {
            if (u.group) {
                const loadedRelations = await getRepository(Group).findOne({where: {id: u.id}, relations: ["Group"]});
                loadedRelations.followees.push(groupToFollow);
                await getRepository(Group).save(loadedRelations);
                response.json(loadedRelations.transfer(true))
            } else {
                response.status = 400;
                done(response.json({message: "not in a group"}));
            }
        }).catch(done(sendServerError))
    } else {
        response.status = 400;
        done(response.json({message: "group doesn't exist"}));
    }
});

/**
 * @api {post} /api/auth/unfollow-wg Unfollow WG
 * @apiName Unfollow WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {String} message The unfollowed groups id
 * @apiError {String} message The error
 */
router.post("/unfollow-wg", async (request: Request, response: Response, done: Function) => {
    let queryObject = QueryString.parse(Url.parse(request.url).query);
    let idString: String = queryObject.id.toString();
    console.log("queryString:" + idString);
    const groupToFollow = await getRepository(Group).findOne({where: {id: idString}});
    if (groupToFollow) {
        loadRelations(request.user).then(async u => {
            if (u.group) {
                const loadedRelations = await getRepository(Group).findOne({where: {id: u.id}, relations: ["Group"]});
                const i = loadedRelations.followees.indexOf(u.group);
                if (i > -1) loadedRelations.followees.slice(i, 1);
                await getRepository(Group).save(loadedRelations);
                response.json(loadedRelations.transfer(true))
            } else {
                response.status = 400;
                done(response.json({message: "not in a group"}));
            }
        }).catch(done(sendServerError))
    } else {
        response.status = 400;
        done(response.json({message: "group doesn't exist"}));
    }
});


/**
 * @api {get} /api/auth/current-challenge Followed WG
 * @apiName Followed WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} challenge gets the current challenge
 * @apiError {String} message The error
 */
router.get("/current-challenge", (request: Request, response: Response, done: Function) => {
    response.json(JSON.stringify(getCurrentChallenge()));
    done(response)
});

async function getCurrentChallenge() : Promise<Challenge>{
    return getRepository(Challenge).findOne({where : {active : 1}});
}

/**
 * @api {post} /api/auth/complete-challenge Complete Challenge
 * @apiName Complete Challenge
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiParam {id} Complete the challenge with this id
 * @apiSuccess {Object} The users group with updated score
 * @apiError {String} message The error
 */
router.post("/complete-challenge", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(async u => {
        u.group.challengesCompleted.push(await getCurrentChallenge());
        let u_g = await getRepository(Group).save(u.group);
        response.json(u_g.transfer(true));
        done(response)
    }).catch((response) =>{
        response.status = 400;
        done(response)
    })

});


/**
 * @api {get} /api/auth/score Score
 * @apiName Score
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Number} The score of the group
 * @apiError {String} message The error
 */
router.get("/score", (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(async u => {
        if (u.group) {
            done(response({"score": u.group.getScore()}));
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));
        }
    }).catch(done(sendServerError))
});

/**
 * @api {get} /api/auth/completed-challenges Completed Challenges
 * @apiName Completed Challenges
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object[]} The completed challenges
 * @apiError {String} message The error
 */
router.get("/completed-challenges", (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(async u => {
        if (u.group) {
            done(response(JSON.stringify(u.group.challengesCompleted)));
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));
        }
    }).catch(done(sendServerError))
});

export {router as ApiContoller} ;