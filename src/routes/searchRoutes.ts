import { Router } from "express";
import {SearchController} from "@/controllers/SearchController";

const router = Router();
const controller = new SearchController();

router.get("/findAll", controller.findAll);
export default router;
