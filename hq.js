  /**
    Harmony Quartet Version 0.0.1
    The Twitter Client Written in Node.js
    Copyright (C) alphaKAI 2014 <alpha.kai.net@alpha-kai-net.info>
  */

  // Load package setings
package = require("./package.json");
  // Load Libraries
var io = require("socket.io"),
    fs = require("fs"),
    qs = require("qs"),
    url = require("url"),
    ejs = require("ejs"),
    http = require("http"),
    path = require("path"),
    util = require("util"),
    twit = require("twit"),
    confu = require("confu"),
    OAuth = require("oauth").OAuth,
    async = require('async'),
    routes = require("./routes"),
    express = require("express");
  // Create Instances
var app = express();

  // Configure
app.configure(function (){
  app.set("port", 3000);
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  app.use(express.cookieParser());
  app.use(express.favicon());
  app.use(express.json());
  app.use(express.logger("dev"));
  app.use(express.methodOverride());
  app.use(express.session({ secret: "y123h89d" }));
  app.use(express.static(__dirname + "/public"));
  app.use(express.urlencoded());
  app.use(app.router);
});

  // configure routing
app.get("/main", routes.main);
app.get("/", function (req, res){
  if(need_oauth_flag){
    res.redirect("/auth");
  } else {
    start(req, res);
    res.redirect("/main");
  }
});
  //OAuth
app.get('/auth', function (req, res){
  oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results){
    if(error){
      console.log(error);
    } else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      req.session.oauth.token_secret = oauth_token_secret;
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
    }
  });
});

app.get('/auth/callback', function (req, res, next){
  var tasks = []; 
  var task1 = function (next){
  console.log("1s");
      if(req.session.oauth){
      console.log("1:if:s");
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth = req.session.oauth;
        oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
        function (error, oauth_access_token, oauth_access_token_secret, results){
          if(error){
            console.log(error);
          } else {
            req.session.oauth.access_token = oauth_access_token;
            req.session.oauth.access_token_secret = oauth_access_token_secret;
            account.access_token = oauth_access_token;
            account.access_token_secret = oauth_access_token_secret;
            console.log("account dump");
            console.log(account);
            twitter = new twit(account);
            admin_name = get_admin_name(twitter);
            fs.writeFile("setting.json", JSON.stringify(account));
          }
        });
      } else {
      console.log("1:if:en");
        //next(new Error("you're not supposed to be here."));
      }
      need_oauth_flag = false;
      console.log("1e");
      next(null);
    };

    var task2 = function (next){ res.redirect("/wait"); next(null); };
    tasks.push(task1);
    tasks.push(task2);
    async.series(tasks);
});
app.get("/wait", routes.wait);

// Start Server
var server = http.createServer(app).listen(app.get("port"), function (){
  console.log("Express server listening on port " + app.get("port"));
});

var io = require("socket.io").listen(server);

var setting_file = confu("setting.json");
var account = {
  "consumer_key": setting_file.consumer_key,
  "consumer_secret": setting_file.consumer_secret,
  "access_token": setting_file.access_token,
  "access_token_secret": setting_file.access_token_secret
};
twitter = null;
admin_name = null;
oa = null;
need_oauth_flag = false;
  // Check  for consumer_key and consumer_secret
if(!account.consumer_key || !account.consumer_secret){
  console.log("ERROR: ConsumerKey or ConsumerSecret is empty. Please Configure setting.json");
  process.exit();
}
if(!account.access_token || !account.access_token_secret){
  console.log("get access token");
  get_access_token();
} else {
  twitter = new twit(account);
  admin_name = get_admin_name(twitter);
}
  //Main Program
function get_access_token(){
  oa = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    account.consumer_key,
    account.consumer_secret,
    "1.0",
    "http://127.0.0.1:3000/auth/callback",
    "HMAC-SHA1"
  );
  need_oauth_flag = true;
}
function get_admin_name(twitter){
  twitter.get("account/verify_credentials", function (err, res){ admin_name = res["screen_name"]; });
}
function ref_admin_name(twitter){
  if(!admin_name){ admin_name = get_admin_name(twitter); }
  return admin_name;
}
var session_status = false;
function start(req, res){
  // Check access token
  var ustream = twitter.stream("user");
  var session_id = null;

  io.sockets.on("connection", function (socket){
    session_id = socket.id;
    session_status = true;
    // Commands request by client
    socket.on("initialize", function (){
      emit_to_client("initialize", ref_admin_name(twitter), session_id);
    });
    socket.on("tweet", function (data){
      twitter.post("statuses/update", { status: data.text }, function (err, res){
      });
    });
    socket.on("reply", function (data){
    console.log("Reply!");
      twitter.post("statuses/update", { status: data.text, 
      in_reply_to_status_id: data.in_reply_to_status_id }, function (err, res){
        console.log(res);
      });
    });

    socket.on("disconnect", function (){
      session_id = null;
      session_status = false;
    });
  });

  ustream.on("tweet", function (data){
    data.text = data.text.replace(/(https?|ftp)(:\/\/[-_.!~*?'()a-zA-Z0-9;?/?:?@&=+?$,%#]+)/gi, '<a href="$1$2">$1$2</a> ');
    if(data.text.match(admin_name)){
      emit_to_client("reply", {
        "status": "reply",
        "id": data.id_str,
        "name": data.user.name,
        "screen_name": data.user.screen_name,
        "text": data.text,
        "icon_url": data.user.profile_image_url
      }, session_id);
    } else {
      emit_to_client("tweet", {
        "status": "tweet",
        "id": data.id_str,
        "name": data.user.name,
        "screen_name": data.user.screen_name,
        "text": data.text,
        "icon_url": data.user.profile_image_url
      }, session_id);
    }
  });
}
function emit_to_client(method, data, session_id){
  if(session_id == null){ return "error"; }
  io.sockets.socket(session_id).emit(method, data);
}