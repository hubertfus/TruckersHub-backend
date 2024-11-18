const router = require('express').Router();
const User = require("../models/user");

router.get("/", async (req, res)=>{
    try{
        const users = await User.find();
        res.json(users)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

router.get("/:id", async (req, res)=>{
    try{
        const user = await User.findById(req.params.id);
        res.json(user)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})


module.exports = router