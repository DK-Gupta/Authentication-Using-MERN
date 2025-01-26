import express from "express";
import cors from "cors"
import mongoose from "mongoose";
import cookieparser from "cookie-parser";
import 'dotenv/config' ;
import connectdb from "./config/mongodb.js";


const app = express();
const port =  process.env.PORT || 4000;
connectdb();

app.use(express.json())
app.use(cookieparser())
app.use(cors({credentials :true}))

app.get('/',(req,res)=> res.send("API Working Fine"));
app.listen(port, ()=> console.log(`Server started on PORT:${port}`));

