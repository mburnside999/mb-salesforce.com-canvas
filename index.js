const { SlowBuffer } = require("buffer");
var express = require("express"),
  bodyParser = require("body-parser"),
  path = require("path"),
  CryptoJS = require("crypto-js");
(request = require("request")),
  (qrcode = require("qrcode-npm")),
  (decode = require("salesforce-signed-request")),
  (app = express()),
  app.use(express.static(__dirname + "/public"));

app.use(bodyParser.json()); // create application/json parser
app.use(bodyParser.urlencoded({ extended: true })); //create application/x-www-urlencoded parser
app.set("view engine", "ejs");

//var views = path.join(__dirname, 'public/views');
var consumerSecret = process.env.CONSUMER_SECRET;
console.log(consumerSecret);

app.get("/", function (req, res) {
  res.render("welcome", {});
});

app.post("/", function (req, res) {
  console.log(JSON.stringify(req.body));
  console.log(JSON.stringify(decode(req.body.signed_request, consumerSecret)));
  // You could save this information in the user session if needed
  var signedRequest = decode(req.body.signed_request, consumerSecret),
    context = signedRequest.context,
    client = signedRequest.client,
    oauthToken = signedRequest.client.oauthToken,
    instanceUrl = signedRequest.client.instanceUrl;

  var hasContactContext = {};
  var recId;

  if (typeof context.environment.record.Id == "undefined") {
    recId = "UNDEFINED";
  } else {
    recId = context.environment.record.Id;
  }

  console.log("recid==>", recId);
  if (recId.substring(0, 3) == "003") {
    query =
      "SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '" +
      context.environment.record.Id +
      "'";
    hasContactContext.value = "true";
  } else {
    query =
      "SELECT Id, FirstName, LastName, Phone, Email FROM Contact  LIMIT 1";
    hasContactContext.value = "false";
  }

  contactRequest = {
    url: instanceUrl + "/services/data/v50.0/query?q=" + query,
    headers: {
      Authorization: "OAuth " + oauthToken,
    },
  };

  console.log("token", oauthToken);
  console.log("client", client);
  console.log(JSON.stringify(context));
  request(contactRequest, function (err, response, body) {
    var qr = qrcode.qrcode(4, "L"),
      contact = JSON.parse(body).records[0],
      text =
        "MECARD:N:" +
        contact.LastName +
        "," +
        contact.FirstName +
        ";TEL:" +
        contact.Phone +
        ";EMAIL:" +
        contact.Email +
        ";;";
    qr.addData(text);
    qr.make();
    var imgTag = qr.createImgTag(4);
    res.render("index", {
      client: client,
      signedRequest: signedRequest,
      context: context,
      imgTag: imgTag,
      contact: contact,
      hasContactContext: hasContactContext,
    });
  });
});

// app.post('/', function (req, res) {
//   // Desk secret key
//   var shared = consumerSecret;
//   // Grab signed request
//   var signed_req = req.body.signed_request;
//   // split request at '.'
//   var hashedContext = signed_req.split('.')[0];
//   var context = signed_req.split('.')[1];
//   //console.log('context',context);
//   let buff = new Buffer(context, 'base64');
//   let text = buff.toString('ascii');
//   console.log(text);

//   let obj = JSON.parse(text);
//   console.log('oauthtoken',obj.client.oauthToken);
//   console.log('username',obj.context.user.userName);

//   // Sign hash with secret
//   var hash = CryptoJS.HmacSHA256(context, shared);
//   // encrypt signed hash to base64
//   var b64Hash = CryptoJS.enc.Base64.stringify(hash);
//   if (hashedContext === b64Hash) {
//     res.cookie('cokkieName','test', { maxAge: 900000, httpOnly: true })
//     res.sendFile(path.join(views, 'index.html'));
//   } else {
//     res.send("authentication failed");
//   };
// })

var port = process.env.PORT || 9001;
app.listen(port);
console.log("Listening on port " + port);
