import express from "express"
import cors from "cors"
import { upload } from "../utles/fileupload.js"
import fs from "fs/promises"
import PdfParse from "pdf-parse-new"
import {Client} from "@octoai/client" 
import path from "path"
import dotenv from "dotenv"

const app = express()
const port = 3000

dotenv.config({path:"./.env"})

app.use(cors({origin:"*", credentials: true}))
app.use(express.json())
app.use(express.static("public"))
const client = new Client(process.env.OCTOAI_TOKENS)


app.post('/api/filecom', upload.single("pdfile"), async (req, res) => {
  try {
    const fileis = req.file
  
    if(path.extname(fileis.path).toLowerCase() !== ".pdf"){
      throw new Error("ext is not pdf")
    }
  
    const buffers = await fs.readFile(fileis.path)
    
    if(!buffers){
      throw new Error("pdf is not supported")
    }
    
    const plaincontent = await PdfParse(buffers).then(e=>{      
      return e.text
  })
  
    
    fs.unlink(fileis.path)
    const resp = await client.chat.completions.create({
      "model":"llama-2-13b-chat",
      "messages":[
          {
              "role": "system",
              "content":" i can summarize the following content",
          },{
              "role": "user",
              "content":`summarize all details of the content : ${plaincontent}`,
          }
      ],
    })
    
    if (!resp?.choices[0].message.content) {
      throw new Error("something went wrong on ai")
    }
    
    res.status(200)
    .json({"main":plaincontent, "res":resp.choices[0].message.content})
  } catch (error) {
    console.log(error);
    
  }

})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})