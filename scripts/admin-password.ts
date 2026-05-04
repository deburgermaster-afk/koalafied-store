import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const arg = process.argv[2];
const password = arg ?? crypto.randomBytes(12).toString("base64url");
const hash = bcrypt.hashSync(password, 10);
console.log("Admin password:", password);
console.log("Set in .env  →  ADMIN_PASSWORD_HASH=", hash);
