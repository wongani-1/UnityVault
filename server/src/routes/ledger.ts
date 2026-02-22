import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as ledgerController from "../controllers/ledgerController";

export const ledgerRoutes = Router();

ledgerRoutes.use(requireAuth);

// Read-only ledger endpoint with filters: memberId, type, from, to, limit
ledgerRoutes.get("/", ledgerController.listLedgerEntries);
