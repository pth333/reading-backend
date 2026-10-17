import { Router } from "express";

import * as BookControler from "#src/controllers/books.controller.ts";

const router = Router();

router.post("/add", BookControler.addShelfBook);
router.get("/detail", BookControler.getBookDetail);
export default router;
