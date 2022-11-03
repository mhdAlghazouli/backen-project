const mongoose = require("mongoose");
const validator = require("validator");
const User = require("./User");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, 
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  user: 
    {
    type: mongoose.Schema.Types.ObjectId, 
    ref: User
    }
  
  
});

const Task = mongoose.model('task', taskSchema);
module.exports = Task;