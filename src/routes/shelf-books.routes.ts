import { Router } from "express";

import * as ShelfBookControler from "#src/controllers/shelf-books.controller.ts";

const router = Router();

router.get("/list", ShelfBookControler.listBooks);
router.post("/update", ShelfBookControler.updateShelfBook);
router.delete("/delete", ShelfBookControler.deleteBook);

export default router;
