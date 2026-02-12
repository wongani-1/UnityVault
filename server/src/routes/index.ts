import { Router } from "express";
import { authRouter } from "./auth";
import { groupsRouter } from "./groups";
import { membersRouter } from "./members";
import { contributionsRouter } from "./contributions";
import { loansRouter } from "./loans";
import { notificationsRouter } from "./notifications";
import { auditRouter } from "./audit";
import { penaltiesRouter } from "./penalties";
import { reportsRouter } from "./reports";
import { adminsRouter } from "./admins";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/groups", groupsRouter);
apiRouter.use("/members", membersRouter);
apiRouter.use("/contributions", contributionsRouter);
apiRouter.use("/loans", loansRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/penalties", penaltiesRouter);
apiRouter.use("/audit", auditRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/admins", adminsRouter);
