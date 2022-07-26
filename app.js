const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express()

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/coursesDB");

//NODE JS MONGO DB DOCUMENTATION link
//https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, "Please enter course name"]
  },
  courseDuration: {
    type: String,
    required: [false, "Please enter course duration"]
  },
  coursePrice: {
    type: String,
    required: [false, "Please enter course price"]
  },
  courseImg: {
    type: String,
    required: [false, "Please enter course Image"]
  },
  courseLink: {
    type: String,
    required: [false, "Please enter course link"]
  }
});

const Course = mongoose.model("Course", courseSchema);

// below end point is use to add a new course
app.post("/addNewCourse", function(req, res) {
  var courseName = req.body.courseName;
  var courseDuration = req.body.courseDuration;
  var coursePrice = req.body.coursePrice;
  var courseImg = req.body.courseImg;
  var courseLink = req.body.courseLink;

  const course = new Course({
    courseName: courseName,
    courseDuration: courseDuration,
    coursePrice: coursePrice,
    courseImg: courseImg,
    courseLink: courseLink
  });
  course.save(function(err){
    if(!err){
      res.send("Course Saved");
    }else{
      res.send(err);
    }
  });
  console.log("Course Saved");
});

// below end point is use to get all courses
app.get("/getAllCourses", function(req, res) {
  Course.find(function(err, courses) {
    if (!err) {
      res.send(courses);
    } else {
      res.send(err);
    }
  })
});

// below end point is use to delete all courses
app.delete("/deleteAllCourses",function(req,res){
  Course.deleteMany(function(err){
    if(!err){
      res.send("All courses deleted..");
    }else{
      res.send(err);
    }
  })
});

//below route is use to get specific course from the list of courses.
app.get("/getCourse/:courseID",function(req,res){
  var id = req.params.courseID;
  //console.log("Param : "+id);
  Course.findOne({_id:id},function(err,course){
    if(!err){
    //  console.log(course);
      res.send(course);
    }else{
      res.send(err);
    }
  })
})

// below end point is use to put an updated version of course in existing course
app.put("/putCourse/:courseID", function(req, res) {
  var courseID = req.params.courseID;
  console.log("ID is "+courseID);

  var courseName = req.body.courseName;
  var courseDuration = req.body.courseDuration;
  var coursePrice = req.body.coursePrice;
  var courseImg = req.body.courseImg;
  var courseLink = req.body.courseLink;

  Course.updateOne({_id:courseID},{
    courseName: courseName,
    courseDuration: courseDuration,
    coursePrice: coursePrice,
    courseImg: courseImg,
    courseLink: courseLink
  },function(err){
      if(!err){
        res.send("Course Updated");
      }else{
        res.send(err);
        console.log(err);
      }
  });
  console.log("Course Updated");
});

//below end point is use to ptach to update any specific field of courses
app.patch("/patchCourse/:courseID",function(req,res){
  var courseID = req.params.courseID;

  Course.updateOne({_id:courseID},
    {$set: req.body},
    function(err){
      if(!err){
        res.send("Course Updated..");
      }else{
        res.send(err);
      }
    }

  )
});

//below end point is use to delete a specific course from list of course
app.delete("/deleteCourse/:courseID",function(req,res){
    var courseID = req.params.courseID;
    Course.deleteOne({_id:courseID},function(err){
      if(!err){
        res.send("Course deleted succesfully..")
      }else{
        res.send(err);
      }
    });
});

// bleow method is use to start our server
app.listen(3000, function() {
  console.log("server started");
});
