import {Router,Request,Response} from "express";
import {getRepository, Like} from "typeorm";
import {Group} from "../entity/Group";
import {User} from "../entity/User";
import * as bodyParser from "body-parser"
import * as Url from "url";
import * as QueryString from "querystring";
import {query} from "express-validator/check";
import {Challenge} from "../entity/Challenge";

let router = Router();

async function loadRelations(user : User) : Promise<User> {
    let u = await getRepository(User).findOne({where: {id : user.id}, relations: ["group"]});
    if (!u) throw new Error ("no such user");
    return u;
}

/**
 * @api {get} /api/profile
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
 * @api {get} /api/wg
 * @apiName WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users group
 * @apiError {String} message The error
 */
router.get("/wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then( u =>{
        if(u.group) {
            done(response.json(u.group.transfer(true)));
        } else {
            response.status = 400;
            response.json({message : "Group not found"});
            done(response)
        }
    }).catch(response);
});

/**
 * @api {post} /api/new-wg
 * @apiName New WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users newly created group
 * @apiError {String} message The error
 * @apiDescription Lets users who are currently not in a group create a new one.
 */
router.post("/new-wg", (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then( u =>{
        if(u.group) {
            response.status = 400;
            done(response.json({message: "already in a group"}));
        } else {
            let newGroup = new Group();
            newGroup.members = [request.user];
            getRepository(Group).save(newGroup).then((g) => {
                if(g == null){
                    response.status = 500;
                    response.json({message : "Group not created"});
                    done(response)
                } else {
                    response.json(g.transfer(true));
                    done(response)
                }
            }).catch(response);
        }
    }).catch(response);


});

/**
 * @api {post} /api/update-wg
 * @apiName Update WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users updated group
 * @apiError {String} message The error
 * @apiDescription Lets users change the display name of their group.
 * @apiParam {String} newName Sets the groups name
 */
router.post("/update-wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then( u =>{
        if(u.group) {
            u.group.name = request.body.newName ;
            getRepository(Group).save(u.group).then((g) => {
                if(g == null){
                    response.status = 400;
                    response.json({message : "Group not found"});
                    done(response)
                } else {
                    response.json(g.transfer(true));
                    done(response)
                }
            }).catch(response);
        } else {
            response.status = 400;
            response.json({message : "Group not found"});
            done(response)
        }
    }).catch(response);
});

/**
 * @api {post} /api/join-wg
 * @apiName Join WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} group The current users new Group
 * @apiError {String} message The error
 * @apiDescription Lets users join a group they have the invite link of.
 * @apiParam {String} inviteId Join group with this invite link
 */
router.post("/join-wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then( u => {

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
        }).catch(response)
    }).catch(response);
});

/**
 * @api {post} /api/leave-wg
 * @apiName Leave WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {String} message
 * @apiError {String} message The error
 * @apiDescription Removes a user from a group.
 */
router.post("/leave-wg", async (request: Request, response: Response, done: Function) => {
    loadRelations(request.user).then(async u =>{
        if(u.group) {
            let g = u.group;
            g.members.splice(g.members.indexOf(u),1);
            u.group = null;

            await getRepository(Group).save(g);
            u = await getRepository(User).save(u);
            response.json(u.transfer(true));
            done(response);
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));

        }
    }).catch(response);
});

/**
 * @api {get} /api/search-wg
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
    let queryString : String = queryObject.query.toString();
    if(!queryObject.query){
        response.status = 400;
        response.json({message: "No search query"});
        done(response)
    } else {
        getRepository(Group).find({name: Like(queryString+"")}).then(groups => {
            let accumulate = Array.from(groups).map(group => group.transfer(false))
            response.json(accumulate);
            done(response)
        }).catch(response)
    }
});

/**
 * @api {get} /api/followed-wgs
 * @apiName Followed WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object[]} groups Groups the users group is following
 * @apiError {String} message The error
 */
router.get("/followed-wgs", (request:Request, response: Response, done: Function) => {
    loadRelations(request.user).then( u => {
        if (u.group) {
            u.group.follows().then( groups => {
                let accumulate = Array.from(groups).map(group => group.transfer(false))
                response.json(accumulate);
                done(response)
            }).catch(response)
        } else {
            response.status = 400;
            done(response.json({message: "not in a group"}));
        }
    }).catch(response)
});

/**
 * @api {post} /api/follow-wg
 * @apiName Follow WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiParam {id} id Follow the group with this id
 * @apiSuccess {Object} group The group the user is now following
 * @apiError {String} message The error
 */
router.post("/follow-wg", async (request: Request, response: Response, done: Function) => {
    let queryObject = QueryString.parse(Url.parse(request.url).query);
    let idString : String = queryObject.id.toString();
    console.log("queryString:" + idString);
    const groupToFollow = await getRepository(Group).findOne({where : {id: idString}});
    if(groupToFollow) {
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
        }).catch(response)
    } else {
        response.status = 400;
        done(response.json({message: "group doesn't exist"}));
    }
});

/**
 * @api {post} /api/unfollow-wg
 * @apiName Unfollow WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {String} message The unfollowed groups id
 * @apiError {String} message The error
 */
router.post("/unfollow-wg", async (request: Request, response: Response, done: Function) => {
    let queryObject = QueryString.parse(Url.parse(request.url).query);
    let idString : String = queryObject.id.toString();
    console.log("queryString:" + idString);
    const groupToFollow = await getRepository(Group).findOne({where : {id: idString}});
    if(groupToFollow) {
        loadRelations(request.user).then(async u => {
            if (u.group) {
                const loadedRelations = await getRepository(Group).findOne({where: {id: u.id}, relations: ["Group"]});
                const i = loadedRelations.followees.indexOf(u.group);
                if(i > -1) loadedRelations.followees.slice(i,1);
                await getRepository(Group).save(loadedRelations);
                response.json(loadedRelations.transfer(true))
            } else {
                response.status = 400;
                done(response.json({message: "not in a group"}));
            }
        }).catch(response)
    } else {
        response.status = 400;
        done(response.json({message: "group doesn't exist"}));
    }
});


/** TODO replace with real implementation, this is here for !!!TESTING!!! purposes
 * @api {get} /api/current-challenge
 * @apiName Followed WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} challenge gets the current challenge
 * @apiError {String} message The error
 */
router.get("/current-challenge", (request: Request, response: Response, done: Function) => {
    const c = new Challenge();
    c.id = 1;
    c.description = "this is a test challenge";
    c.startDate = new Date(Date.now() - 24*60*60*1000);
    c.endDate = new Date(Date.now() + 24*60*60*1000);
    c.title = "Do something!";
    c.imageUrl = "https://unsplash.com/search/photos/green";
    response.json(JSON.stringify(c));
    done(response)
});

export {router as ApiContoller} ;