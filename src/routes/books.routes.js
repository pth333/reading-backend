import { Router } from "express";

import * as BookControler from "#src/controllers/books.controller.js";

const router = Router();

router.post("/add", BookControler.addShelfBook);
router.get("/detail", BookControler.getBookDetail);
export default router;
