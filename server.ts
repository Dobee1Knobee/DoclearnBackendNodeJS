import * as dotenv from "dotenv";
import express from "express";

dotenv.config();
const app = express();

async function main() {
    app.use(express.json());
    app.listen(process.env["PORT"] || 4200, () => {
        console.log("Server started on port 4200");
    });
}
main()