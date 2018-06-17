import {Router,Request,Response} from "express";

let router = Router();
router.get('/', (req: Request, res: Response) =>{
    return res.render('index', {home_active: "active"})
});

//Other static pages like EULA etc... moved to client

export {router as IndexController} ;