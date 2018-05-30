import {LoginController} from "./controller/LoginController";
import {IndexController} from "./controller/IndexController";
import * as express from "express";

let router = express.Router();
router.use('/', IndexController);
router.use('/', LoginController);
export {router as FrontEndController};

