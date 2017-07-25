var cheerio = require("cheerio");
  var request = require("request");
//var mongojs = require("mongojs");
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

mongoose.Promise = Promise;

var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

//what is this?
mongoose.connect("mongodb://localhost/");
var db = mongoose.connection;

db.once("open", function(){
  console.log("Mongoose connection successful.");
})

/*if (process.env.MONGODB_URI){
  mongoose.connect(process.env.MONGODB_URI);
}else{
  mongoose.connect(db);
};*/

//var databaseUrl = "scraper";
//var collections = ["scrapedData"];

app.get("/scrape", function(req, res){
// First, tell the console what server.js is doing
console.log("\n***********************************\n" +
            "Getting cover art, artist, and album title from Pitchfork.com's latest reviews:" +
            "\n***********************************\n");
// Making a request for reddit's "webdev" board. The page's HTML is passed as the callback's third argument
request("http://pitchfork.com/reviews/albums/", function(error, response, html) {
  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(html);
  // An empty array to save the data that we'll scrape
 
  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $("div.review").each(function(i, element) {

     var result = {};
    // Save the text of the element in a "title" variable
    result.coverArt = $(element).children().children().children().children().attr("src");
    result.link = $(element).children().find("href");
    result.artist = $(element).children().children().children().find("li").text();
    result.title = $(element).children().children().find("h2.title").text();
    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    //var link = $(element).children().attr("href");
    // Save these results in an object that we'll push into the results array we defined earlier
    console.log(result.coverArt);
    console.log(result.artist);
    console.log(result.title);
    console.log(result.link);

    var coverArt = result.coverArt;
    var artist = result.artist;
    var title = result.title;
    var link = result.link;

    var entry = new Article(result);

    entry.save(function(err, doc){
      if (err){
        console.log(err);
      }
      else {
        console.log(doc);
      }
    });

  });
});
res.send("Scrape Complete");

});
    
   /* results.push({
      coverArt: coverArt,
      artist: artist,
      title: title
      //link: link
    });
  });
  // Log the results once you've looped through each of the elements found with cheerio
  console.log(results);
});
});*/

app.get("/articles", function(req, res){
  Article.find({})
  .populate("article")
  .exec(function(error, doc){
    if (error){
      console.log(error);
    } else {
      res.json(doc);
    }
  })   
});


app.get("/articles/:id", function(req, res) {
  Article.findOne({"_id": req.params.id})

  .populate("note")

  .exec(function(error, doc){
    if (error){
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

app.post("/articles/:id", function(req, res){
  var newNote = new Note(req.body);

  newNote.save(function(error, doc){
    if (error){
      console.log(error);
    }
    else{
      Article.findOneAndUpdate({"_id": req.params.id }, {"note": doc._id})
      .exec(function(err, doc){
        if (err){
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
    }
  });
});

app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(3000, function(){
  console.log("App running on port 3000!");
})