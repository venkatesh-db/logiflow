import { getDb } from "@logiflow/shared-db";
console.log(getDb().prepare("SELECT actor, tool, decision, reason FROM audit_log").all());
