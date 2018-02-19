require('dotenv').config();
const express = require("express");
const app = express();
const ringcentral = require('ringcentral');
const bodyParser = require('body-parser')

  app.use(bodyParser());
app.use(express.static(__dirname + '/assets'));

// Start HTTP server
var server = null;
const port = process.env.MY_APP_PORT;
const useTls = process.env.MY_APP_TLS_ENABLED > 0 ? true : false;
var isloggedIn = false;

if (useTls) {
  var fs = require('fs');
  server = require('https')
    .createServer({
      key: fs.readFileSync(process.env.MY_APP_TLS_PRIVATE_KEY),
      cert: fs.readFileSync(process.env.MY_APP_TLS_PUBLIC_CERT)
    }, app)
    .listen(port, function () {
      console.log('LISTEN_HTTPS ' + port);
    });
} else {
  server = require('http')
    .Server(app)
    .listen(port, function () {
      console.log('LISTEN_HTTP ' + port);
    });
}

// Start RingCentral SDK
const rcsdk = new ringcentral({
    server: process.env.RC_APP_SERVER_URL,
    appKey: process.env.RC_APP_KEY,
    appSecret: process.env.RC_APP_SECRET
  });

const config = {
  authorize_uri: rcsdk.platform().authUrl({
    brandId: process.env.RC_APP_BRAND_ID, // optional
    redirectUri: process.env.RC_APP_REDIRECT_URL // optional if 1 configured
  }),
  redirect_uri: process.env.RC_APP_REDIRECT_URL
}

app.get('/', function (req, res) {
  homePageLoader(res);
});

app.get('/validatelogin', function (req, res) {
  return res.json({
    logggedin: isloggedIn,
    "config": config
  });
});

app.get('/callback.html', function (req, res) {
  if (req.query.code) {
    rcsdk.platform()
    .login({
      code: req.query.code,
      redirectUri: process.env.RC_APP_REDIRECT_URL
    })
    .then(function (response) {
      isloggedIn = true;
      res.json({
        login: true
      });
    })
    .catch(function (e) {
      console.log('ERR ' + e.message || 'Server cannot authorize user');
      res.json({
        login: false
      });
    });
  } else {
    res.json({
      login: false
    });
  }
});

app.post('/callhistory/', function (req, res) {
  var that = this;
  var thatRes = res;
  var token = rcsdk.platform().auth().data();
  var platform = rcsdk.platform();
  var callLogData;
  var dateFrom = req.body.dateFrom;
  var dateTo = req.body.dateTo;
  if (getToken() != '') {
    var url = getQueryUrl(process.env.CALL_LOG_URL, dateFrom, dateTo);
    platform.
    get(url).
    then(function (res) {
      that.callLogData = res.json().records;
      token_json = getToken();
      return thatRes.json({
        data: that.callLogData,
        login: isloggedIn
      });
    }).catch(function (e) {
      conole.log('Error: in getting call logs with message \n\n' + e.message);
      return thatRes.json({
        error: e.message
      });
    });
  } else {
    isloggedIn = false;
    return thatRes.json({
      login: isloggedIn
    });
  }
});

app.post('/ringout/', function (req, res) {
  var that = this;
  var thatRes = res;
  var token = rcsdk.platform().auth().data();
  var platform = rcsdk.platform();
  var callLogData;
  var from = req.body.from;
  var to = req.body.to;
  var payload = {
    "from": {
      "phoneNumber": from,
      "forwardingNumberId": ""
    },
    "to": {
      "phoneNumber": to
    },
    "callerId": {
      "phoneNumber": ""
    },
    "playPrompt": false,
    "country": {
      "id": ""
    }
  };
  if (getToken() != '') {
    platform.
    post(process.env.RING_OUT_LOG_URL, payload).
    then(function (res) {
      return thatRes.json({
        data: res.json().status,
        login: isloggedIn
      });
    }).catch(function (e) {
      conole.log('Error: in making ring out with message \n\n' + e.message);
      return thatRes.json({
        error: e.message
      });
    });
  } else {
    isloggedIn = false;
    return thatRes.json({
      login: isloggedIn
    });
  }
});

var getQueryUrl = (baseUrl, dateFrom, dateTo) => {
  return `${baseUrl}?dateFrom=${dateFrom}&dateTo=${dateTo}`;
};

var homePageLoader = (res) => {
  res.sendfile("./views/index.html");
}
var getToken = () => {
  var token = rcsdk.platform().auth().data();
  return token['access_token'] ? JSON.stringify(token, null, ' ') : '';
}