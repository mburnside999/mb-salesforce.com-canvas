const { SlowBuffer } = require('buffer');
var express  = require('express'),
  bodyParser = require('body-parser'),
  path       = require('path'),
  CryptoJS   = require("crypto-js");
  const session = require('express-session');

var sess; // global session, NOT recommended

app= express(),
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));

app.use(bodyParser.json()); // create application/json parser
app.use(bodyParser.urlencoded({ entended: true })); //create application/x-www-urlencoded parser

var views = path.join(__dirname, 'public/views');
 var   consumerSecret = process.env.CONSUMER_SECRET;

app.get('/', function (req, res) {
  res.sendFile(path.join(views, 'index.html'));
});

app.post('/', function (req, res) {
  sess = req.session;
  // Desk secret key	
  var shared = consumerSecret;
  // Grab signed request
  var signed_req = req.body.signed_request;
  // split request at '.'
  var hashedContext = signed_req.split('.')[0];
  var context = signed_req.split('.')[1];
  //console.log('context',context);
  let buff = new Buffer(context, 'base64');
  let text = buff.toString('ascii');
  console.log(text);
  sess.context = text;

  let obj = JSON.parse(text);
  console.log('oauthtoken',obj.client.oauthToken);
  console.log('username',obj.context.user.userName);

  // Sign hash with secret
  var hash = CryptoJS.HmacSHA256(context, shared); 
  // encrypt signed hash to base64
  var b64Hash = CryptoJS.enc.Base64.stringify(hash);
  if (hashedContext === b64Hash) {
    res.sendFile(path.join(views, 'index.html'));
  } else {
    res.send("authentication failed");
  };  		
})

var port = process.env.PORT || 9000;
app.listen(port);
console.log('Listening on port ' + port);
