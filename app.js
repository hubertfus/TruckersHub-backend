require('dotenv').config()
const express = require('express')
const cors = require("cors")
const mongoose = require('mongoose');


const userRoutes = require("./routes/user")
const orderRoutes = require("./routes/orders")



const app = express()
const port = process.env.PORT || 3000

app.use(cors())

mongoose.connect(process.env.CONNECTION_STRING).then(()=>{
    console.log("dziala poloczenie")
})

app.use("/users",userRoutes)
app.use("/orders", orderRoutes)


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
// znowu mnie leb