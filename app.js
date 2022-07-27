require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express()

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "Out little secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//mongodb://localhost:27017/coursesDB
mongoose.connect(process.env.DB_URL);

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

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// below end point is to display home page
app.get("/", function(req, res) {
  res.render("index");
});

// below end point is use to display register page.
app.get("/register", function(req, res) {
  res.render("register");
});

// below end point is use to register the user in our db.
app.post("/register", function(req, res) {
  User.register({
    username: req.body.username,
    password: md5(req.body.password)
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/courses");
      })
    }
  });
});

// below end point is use to display login page
app.get("/login", function(req, res) {
  res.render("login");
});

// below end point is use to login our user
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/courses");
      });
    }
  });
});

// below end point is use to display course page.
app.get("/courses", function(req, res) {
  //console.log("Req is "+req.user);
  if (req.isAuthenticated()) {
    Course.find(function(err, courses) {
      if (!err) {
        //  console.log(courses);
        res.render("courses", {
          courseList: courses
        });
      } else {
        res.send(err);
      }
    });
  } else {
    res.redirect("/login");
  }
});

// below end point is use to add new course to courses.
app.post("/createCourse", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("addCourse");
  } else {
    res.redirect("login");
  }
});

// below end point is use to open add new course page.
app.get("/createCourse", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("addCourse");
  } else {
    res.redirect("login");
  }
});

// below end point is use to add new course to mongo db.
app.post("/addNewCourseWeb", function(req, res) {
  var courseName = req.body.courseName;
  var courseDuration = req.body.courseDuration;
  var coursePrice = req.body.coursePrice;
  var courseImg = req.body.courseImage;
  var courseLink = req.body.courseLink;

  const course = new Course({
    courseName: courseName,
    courseDuration: courseDuration,
    coursePrice: coursePrice,
    courseImg: courseImg,
    courseLink: courseLink
  });

  if (req.isAuthenticated()) {
    course.save(function(err) {
      if (!err) {
        console.log("New Course Added through web");
        res.redirect("courses");
      } else {
        res.send(err);
      }
    });
  } else {
    res.redirect("login");
  }
});

// below end point is use to view course link.
app.post("/viewCourseWeb", function(req, res) {
  console.log(req.body.courseLink);
  res.redirect(req.body.courseLink);
});

// below end point is use to load update course page.
app.post("/updateCoursePage", function(req, res) {
  const courseID = (req.body.courseID);
  console.log(courseID);

  if (req.isAuthenticated()) {
    console.log(courseID);

    Course.findOne({
      _id: courseID
    }, function(err, course) {
      if (!err) {
        //  console.log(course);
        res.render("updateCourse", {
          course: course
        });
      } else {
        res.send(err);
      }
    })

  } else {
    res.redirect("/login");
  }
});

// below end point is use to update our course in db.
app.post("/updateCourseWeb", function(req, res) {
  var courseName = req.body.courseName;
  var courseDuration = req.body.courseDuration;
  var coursePrice = req.body.coursePrice;
  var courseImg = req.body.courseImg;
  var courseLink = req.body.courseLink;
  var courseID = req.body.courseID;

  if (req.isAuthenticated()) {
    Course.updateOne({
      _id: courseID
    }, {
      courseName: courseName,
      courseDuration: courseDuration,
      coursePrice: coursePrice,
      courseImg: courseImg,
      courseLink: courseLink
    }, function(err) {
      if (!err) {
        res.redirect("/courses");
      } else {
        res.send(err);
        console.log(err);
      }
    });
    console.log("Course Updated");
  }else{
    res.redirect("/login");
  }

});

// below end point is use to delete course from db .
app.post("/deleteCourseWeb", function(req, res) {
  const courseID = req.body.courseID;
  if (req.isAuthenticated()) {
    Course.deleteOne({
      _id: courseID
    }, function(err) {
      if (!err) {
        res.redirect("/courses");
      } else {
        res.send(err);
      }
    });
  }else{
    res.redirect("/login")
  }

})



/////////////////// FROM BELOW ONWARDS CREATING APIS FOR APPLICATION //////////////////////////


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

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);
        course.save(function(err) {
          if (!err) {
            res.send("Course Saved");
          } else {
            res.send(err);
          }
        });
        console.log("Course Saved");
      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });
});

// below end point is use to get all courses
app.get("/getAllCourses", function(req, res) {

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);
        Course.find(function(error, courses) {
          if (!error) {
            res.send(courses);
          } else {
            res.send(error);
          }
        });
      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });


});

// below end point is use to delete all courses
app.delete("/deleteAllCourses", function(req, res) {

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);
        Course.deleteMany(function(err) {
          if (!err) {
            res.send("All courses deleted..");
          } else {
            res.send(err);
          }
        })

      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });

});

//below route is use to get specific course from the list of courses.
app.get("/getCourse/:courseID", function(req, res) {
  var id = req.params.courseID;
  //console.log("Param : "+id);

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);
        Course.findOne({
          _id: id
        }, function(err, course) {
          if (!err) {
            //  console.log(course);
            res.send(course);
          } else {
            res.send(err);
          }
        });
      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });

});

// below end point is use to put an updated version of course in existing course
app.put("/putCourse/:courseID", function(req, res) {
  var courseID = req.params.courseID;
  console.log("ID is " + courseID);

  var courseName = req.body.courseName;
  var courseDuration = req.body.courseDuration;
  var coursePrice = req.body.coursePrice;
  var courseImg = req.body.courseImg;
  var courseLink = req.body.courseLink;

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);

          Course.updateOne({
            _id: courseID
          }, {
            courseName: courseName,
            courseDuration: courseDuration,
            coursePrice: coursePrice,
            courseImg: courseImg,
            courseLink: courseLink
          }, function(err) {
            if (!err) {
              res.send("Course Updated");
            } else {
              res.send(err);
              console.log(err);
            }
          });
          console.log("Course Updated");

      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });

});

//below end point is use to ptach to update any specific field of courses
app.patch("/patchCourse/:courseID", function(req, res) {
  var courseID = req.params.courseID;

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);
          Course.updateOne({_id: courseID}, {$set: req.body},
            function(err) {
              if (!err) {
                res.send("Course Updated..");
              } else {
                res.send(err);
              }
            });

      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });

});

//below end point is use to delete a specific course from list of course
app.delete("/deleteCourse/:courseID", function(req, res) {
  var courseID = req.params.courseID;

  var userName = req.headers["username"];
  var userPwd = req.headers["password"];
  console.log(userName+"    "+userPwd);

  User.findOne({userName:userName},function(err,foundUser){
    if(!err){
      console.log(foundUser.password);
      if(foundUser.password === md5(userPwd)){
        console.log(foundUser);
          Course.deleteOne({
            _id: courseID
          }, function(err) {
            if (!err) {
              res.send("Course deleted succesfully..")
            } else {
              res.send(err);
            }
          });
      }else{
        res.send("Invalid user");
      }
    }else{
      res.send(err);
    }
  });
});

// bleow method is use to start our server
let port = process.env.PORT;
if(port==null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("server started");
});
