import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { studentRouter } from "./routes/student.js";
import { supervisorRouter } from "./routes/supervisor.js";

// TODO (backend owner): wire routers + error handler.
// Suggested order (PRD §18): profile/placement/logbook → supervisor.

const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://intern-flow-lime.vercel.app";
const allowedOrigins = [FRONTEND_URL, "http://localhost:5173"];
const app = express();
// Render/Vercel sit behind a proxy — required so Secure cookies work over HTTPS.
app.set("trust proxy", 1);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// better-auth owns /api/auth/* (sign-up, sign-in, sign-out, session).
app.all("/api/auth/*", toNodeHandler(auth));

// Who-am-I is served by routes/auth.ts (GET /api/me).
app.use("/api", authRouter);
app.use("/api", studentRouter);
app.use("/api", supervisorRouter);

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => console.log(`backend on :${port}`));
