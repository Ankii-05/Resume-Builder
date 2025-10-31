import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import userRouter from './routes/userRoutes.js'
import path from 'path'
import { fileURLToPath } from 'url'
import resumeRouter from './routes/resumeRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)


const app = express()
const PORT = 4000;

app.use(cors())

// connect database

// middleware
app.use(express.json())
app.use('/', userRouter)
app.use('/', resumeRouter)

app.use(
    'uploads',
    express.static(path.join(__dirname, 'uploads'), {
        setHeaders: (res, _path) => {
            res.set('Access-Control-Allow-Origin', 'http://localhost:4000/')
        }
    })
)

// routes
app.get('/', (req, res) => {
    res.send("API WORKING")
})

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    
})

// database
mongoose.connect("mongodb+srv://ankitkushwah6195:Ankit%402003@cluster0.cuexyu3.mongodb.net/Resume-Builder")
    .then(() => console.log("Database connected successfully"))
    .catch(() => console.log("Database not connected"));


