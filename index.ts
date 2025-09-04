import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as database from "./config/db";
import mainRoutes from "./routes/index.route";

dotenv.config();

database.connect();
// kết nối supabase


const app: Express = express();
app.use(express.json());
const port: number | string = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());


mainRoutes(app);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
