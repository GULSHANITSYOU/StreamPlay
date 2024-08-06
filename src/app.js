import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// +++++++ Middlewares ++++++++++ 
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// ======= Middlewares for Json parsing =======
app.use(
  express.json({
    limit: "20kb",
  })
);

// ======= Middlewares for URL parsing  =========
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

// =========== Middlewares for cookie parsing ======
app.use(cookieParser());
// ========= Middlewares for Media (🙄) ======= 
app.use(express.static("public"));

export { app };
