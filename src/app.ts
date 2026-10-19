import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import express from "express";

import routes from "#src/routes/index.ts";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: ["http://localhost:8443", "https://reading-traker.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.use(
  (
    err: Error & { status?: number; statusCode?: number },
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const status = err.status ?? err.statusCode ?? 500;

    if (status >= 500) {
      console.error(err);
    }

    res.status(status).json({
      error: status >= 500 ? "Internal Server Error" : err.message,
      ...(process.env.NODE_ENV === "production" ? {} : { detail: err.message }),
    });
  },
);

export default app;
