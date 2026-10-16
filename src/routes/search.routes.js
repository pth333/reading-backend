import { Router } from "express";

import * as searchController from "#src/controllers/search.controller.js";

const router = Router();


router.get("/", searchController.search);

export default router;
