import {Router, Request, Response} from "express";
import {getRepository, LessThan, Like, MoreThan} from "typeorm";
import {Group} from "../entity/Group";
import {User} from "../entity/User";
import * as bodyParser from "body-parser"
import * as Url from "url";
import * as QueryString from "querystring";
import {query} from "express-validator/check";
import {Challenge} from "../entity/Challenge";
import {arraysAreEqual} from "tslint/lib/utils";
import {Member} from "../entity/Member";
import {loadConfigurationFromPath} from "tslint/lib/configuration";
import {Alert} from "../entity/Alert";
import {DateUtils} from "typeorm/util/DateUtils";

let router = Router();

async function loadRelations(user: User): Promise<User> {
    let u = await getRepository(User).findOne({where: {id: user.id}, relations: ["membership"]});
    if (!u) console.error("no such user");
    return u;
}

async function loadMembership(user: User): Promise<Member> {
    return await getRepository(Member).findOne({where: {user: user.id}, relations: ["user","group"]});

}

function sendServerError(response: Response, done: Function) {
    console.error("error handler called");
    response.status = 500;
    response.json({message: "Internal Server error"});
    return done()
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
    try {
        let m = await loadMembership(request.user);
        if (m) {
            response.json(await m.group.transfer(true))
            done();
        } else {
            response.json({message: "Group not found"});
            done()
        }
    } catch (e) {
        console.error(e);
        sendServerError(response, done)
    }
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
router.post("/new-wg", async (request: Request, response: Response, done: Function) => {
    let m = await loadMembership(request.user);
    if (m) {
        response.json({message: "already in a group"})
        done();
    } else {
        m = new Member();
        let newGroup = new Group();
        m.user = request.user;
        m.group = newGroup;
        newGroup.members = [m];

        await getRepository(Group).save(newGroup);

        await getRepository(Member).insert(m);

        response.json(newGroup.transfer(true));
        done();
    }

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
    let m = await loadMembership(request.user);
    if (m.group) {
        const similar = await getRepository(Group).find({where: {name: request.body.name}});
        if(similar.length > 0) {
            response.sendStatus(409);
            done();
        } else {
            m.group.name = request.body.newName;
            getRepository(Group).save(m.group).then((g) => {
                if (g == null) {
                    response.status(400);
                    response.json({message: "Group not found"});
                    done(response)
                } else {
                    response.json(g.transfer(true));
                    done(response)
                }
            })
        }
    } else {
        response.status = 400;
        response.json({message: "Group not found"});
        done(response)
    }

});

/**
 * @api {post} /api/auth/join-wg Join WG
 * @apiName Join WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users new Group
 * @apiError {String} message The error
 * @apiDescription Lets users join a group they have the invite link of.
 * @apiParam {String} inviteLink Join group with this invite link
 */
router.post("/join-wg", async (request: Request, response: Response, done: Function) => {
    let m = await loadMembership(request.user);
    if (m != null) {
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
            m = new Member();
            m.group = g;
            m.user = request.user;
            await getRepository(Member).save(m);
            let updated = await getRepository(Group).findOne({id: g.id});
            response.json(updated.transfer(true));
            done(response)
        }
    })

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
    let m = await loadMembership(request.user);
    if(m) {
        try {
            await getRepository(Member).remove(m);
            response.json({message: "left group"});
        } catch (e) {
            console.error(e);
            response.json({message: JSON.stringify(e)})
        }
    } else {
        response.status = 400;
        done(response.json({message: "not in a group"}));
    }
    done();
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
        getRepository(Group).find({where: { name : Like("%"+queryString+"%") }}).then(groups => {
            let accumulate = Array.from(groups).map(async group => await group.transfer(false))
            Promise.all(accumulate).then((acc) => {
                response.json(acc);
                done()
            }).catch((err) => {
                console.error(err);
                sendServerError(response, done);
            })
        })
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
router.get("/followed-wgs", async (request: Request, response: Response, done: Function) => {
    let m = await loadMembership(request.user);
    if (m.group) {
        m.group.getFollows().then(groups => {
            let accumulate = Array.from(groups).map(async group => await group.transfer(false))
            Promise.all(accumulate).then((acc) => {
                response.json(acc);
                done()
            }).catch((err) => {
                console.error(err);
                sendServerError(response, done);
            });
        });
    } else {
        response.status = 400;
        done(response.json({message: "not in a group"}));
    }

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
    let idString: String = request.body.id;
    const groupToFollow = await getRepository(Group).findOne({where: {id: idString}});
    if (groupToFollow) {
        loadMembership(request.user).then(async m => {
            if (m.group) {
                const loadedRelations = await getRepository(Group).findOne({where: {id: m.group.id}, relations: ["followees"]});
                loadedRelations.followees.push(groupToFollow);
                await getRepository(Group).save(loadedRelations);
                response.json(loadedRelations.transfer(true))
            } else {
                response.status = 400;
                done(response.json({message: "not in a group"}));
            }
        })
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
    let idString: String = request.body.id;
    const groupToUnfollow = await getRepository(Group).findOne({where: {id: idString}});
    if (groupToUnfollow) {
        loadMembership(request.user).then(async m => {
            if (m.group) {
                const loadedRelations = await getRepository(Group).findOne({where: {id: m.group.id}, relations: ["followees"]});
                loadedRelations.followees = loadedRelations.followees.filter((g) => g.id !== groupToUnfollow.id);
                await getRepository(Group).save(loadedRelations);
                response.json(loadedRelations.transfer(true))
            } else {
                response.status = 400;
                done(response.json({message: "not in a group"}));
            }
        })
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
router.get("/current-challenge", async (request: Request, response: Response, done: Function) => {
    let challenge = await getCurrentChallenge()
    response.json(challenge);

    done()
});

async function getCurrentChallenge(): Promise<Challenge> {
    let c = await getRepository(Challenge).findOne({where: {active: 1}});
    return c;
}

router.get("/alerts", async (request: Request, response: Response, done: Function) => {

    let alerts = await getRepository(Alert).find().catch((err) => console.error(err));
    if(alerts) {
        alerts.filter(alert => alert.shouldSend)
    }
    response.json(alerts);
    done();
});

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
    loadMembership(request.user).then(async m => {
        m.challengesCompleted.push(await getCurrentChallenge());
        await getRepository(Member).save(m);
        response.json({message: "success"});
        done(response)
    }).catch((response) => {
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
    loadMembership(request.user).then(async m => {
        if (m.group) {
            done(response({"score": m.group.getScore()}));
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));
        }
    })
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

    if(request.query.id) {
        getRepository(Group).findOne({id: request.query.id}).then(async g => {
            const completetChallenges = await g.completedChallenges();
            const scoreHistory = await g.getScoreHistory();
            response.json({
                completedChallenges: completetChallenges,
                getScoreHistory: scoreHistory
            });
            done();
        }).catch(err => {
            console.error(err);
            response.sendStatus = 400;
            done();
        })
    } else {
        loadMembership(request.user).then(async m => {
            if (m.group) {
                const completetChallenges = await m.group.completedChallenges();
                const scoreHistory = await m.group.getScoreHistory();
                response.json({
                    completedChallenges: completetChallenges,
                    scoreHistory: scoreHistory
                });
                done();
            } else {
                response.status = 400;
                response.json({message: "not in a group"});
                done();
            }
        })
    }
});

router.get("/past-challenges", async (request: Request, response: Response, done: Function) => {

    let nowString = DateUtils.mixedDateToDatetimeString(new Date(Date.now()));

    let p = await getRepository(Challenge).find({where: {endDate: LessThan(nowString)}});
    response.json(p)
    done();

});

export {router as ApiContoller} ;