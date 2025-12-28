import express from "express";
import cors from "cors";
import "dotenv/config";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";
import routers from "./routes/router.js";

dotenv.config({path:"./config/config.env"});


const app = express();

await connectDatabase();

app.use(cors({
    origin:["http://localhost:4200"],
    methods:['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials:true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/', routers);

// app.get('/',(req, res) =>{
//     res.send('Hello World');
// })

const PORT = process.env.PORT || 4002;
app.listen(PORT,() =>{
    console.log(`server is running on port ${PORT}`);
})