const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { requireAuth, checkUser } = require ('./middleware/authMiddleware');
const Task = require("./models/Task");
const User = require("./models/User");
const { ObjectId } = require('mongoose');
require('dotenv').config();



const app = express();

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: maxAge,
  });
}


// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// view engine
app.set('view engine', 'ejs');

// database connection
const dbURI = process.env.S3_BUCKET;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));


// routes
app.get("*", checkUser);
app.get('/', requireAuth, async (req, res, next) => {
      const token = req.cookies.jwt;
      jwt.verify(token, process.env.SECRET_KEY, async (err, decodedToken) => {
        if(err){
          console.log(err.message);
        }else {
          const tasks = await Task.find({user: decodedToken.id}).populate("user", "firstName");
          if(tasks.length > 0){
            res.render("home",{
              data: tasks
            });
          }else{
            res.render("home", {
              data: null
            });
          }
        }
      });
  
});
app.get('/tasks', requireAuth,  (req, res) => res.render('tasks'));
app.post('/tasks', async (req, res, next) => {
        console.log("POST /tasks")
        const token = req.cookies.jwt;
        jwt.verify(token, process.env.SECRET_KEY, async (err, decodedToken) => {
          if(err){
            console.log(err.message);
          }else {
            const { title, description, date, user } = req.body;
            const task = await Task.create({ title, description, date, user: decodedToken.id });
            next();
          }
        });
      

});
app.get("/delete/:id", async (req,res) => {
  const taskDeleted = await Task.findByIdAndRemove(req.params.id, (err, doc ) => {
    if(!err){
      res.redirect('/')
    }else{
      console.log('error in task delete: ', err)
    }
  })
});

app.get("/edit/:id", (req, res, next) => {
  console.log("this is: ", req.params.id);
  Task.find({_id : req.params.id}, req.body, {new : true}, (err, doc) => {
    if(err){
      console.log("problem", err)
    }else{
      console.log(doc)
      res.render('edit', {
        data: doc[0]
      });
    }
  });
});
app.post('/edit/:id', (req,res, next) => {
  console.log("this is the req: ", req.params.id);
  Task.findOneAndUpdate({_id : req.params.id}, req.body, {new : true}, (err, doc) => {
    if(err){
      console.log("problem", err)
      next(err)
    }else{
      console.log("this is the doc: ", doc)
      res.redirect('/')
    }
  });
})

app.use(authRoutes);
