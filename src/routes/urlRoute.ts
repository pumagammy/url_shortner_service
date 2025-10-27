import express from "express";
import { createShortCode } from "../controllers/createShortcode";


const router = express.Router();

router.post("/create-shortUrl",async(req,res)=>{
const createShortUrl = await createShortCode(req,res)
console.log(createShortUrl)
return createShortUrl;
})

export default router;