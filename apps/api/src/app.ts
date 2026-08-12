import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { requirementsRouter } from "./routes/requirements.js";
import { directoryRouter } from "./routes/directory.js";
import { slaRulesRouter } from "./routes/sla-rules.js";
import { approvalsRouter } from "./routes/approvals.js";
import { scoringRouter } from "./routes/scoring.js";
import { inviteRouter } from "./routes/invite.js";
import { vendorRouter } from "./routes/vendor.js";
import { buyerRouter } from "./routes/buyer.js";
import { linksRouter } from "./routes/links.js";
import { contractsRouter } from "./routes/contracts-v2.js";
import { uploadsRouter } from "./routes/uploads.js";
import { filesRouter } from "./routes/files.js";
import { teamRouter } from "./routes/team.js";
import { errorHandler } from "./middleware/error-handler.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "12mb" }));
app.use("/api", healthRouter);
app.use("/api/requirements", requirementsRouter);
app.use("/api/requirements", scoringRouter);
app.use("/api/directory", directoryRouter);
app.use("/api/sla-rules", slaRulesRouter);
app.use("/api/approvals", approvalsRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/buyer", buyerRouter);
app.use("/api/links", linksRouter);
app.use("/api/contracts", contractsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/files", filesRouter);
app.use("/api/team", teamRouter);
app.use("/api/invite", inviteRouter);

app.all("/api/*splat", (_request, response) => {
  response.status(404).json({ success: false, error: "API route not found" });
});

if (env.NODE_ENV === "production") {
  const frontendDist = path.resolve(process.cwd(), "apps/api/frontend");
  app.use(express.static(frontendDist));
  app.get("/*splat", (_request, response) => {
    response.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(errorHandler);
