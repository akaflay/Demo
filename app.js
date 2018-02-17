require('dotenv').config();
var app = require('express')();
var ringcentral = require('ringcentral');

// Configure Mustache
var mustacheExpress = require('mustache-express');
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// Start HTTP server
var server = null;
var port = process.env.MY_APP_PORT;
var useTls = process.env.MY_APP_TLS_ENABLED > 0 ? true : false;

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
var rcsdk = new ringcentral({
    server: process.env.RC_APP_SERVER_URL,
    appKey: process.env.RC_APP_KEY,
    appSecret: process.env.RC_APP_SECRET
  });

app.get('/', function (req, res) {
  homePageLoader(res);
});

app.get('/callback.html', function (req, res) {
  if (req.query.code) {
    rcsdk.platform()
    .login({
      code: req.query.code,
      redirectUri: process.env.RC_APP_REDIRECT_URL
    })
    .then(function (response) {
      console.log('logged_in');
      res.send('');
    })
    .catch(function (e) {
      console.log('ERR ' + e.message || 'Server cannot authorize user');
      res.send('');
    });
  } else {
    res.send('');
  }
});

app.get('/callhistory/dateFrom/:dateFrom/dateTo/:dateTo', function (req, res) {
  var that = this;
  var thatRes = res;
  var token = rcsdk.platform().auth().data();
  var platform = rcsdk.platform();
  var callLogData;
  var dateFrom= req.params.dateFrom;
  var dateTo= req.params.dateTo;
  if (getToken() != '') {
    var url=getQueryUrl(process.env.CALL_LOG_URL,dateFrom,dateTo);
    platform.
    get(url).
    then(function (res) {
      that.callLogData = res.json().records;
      token_json = getToken();
      thatRes.render('index', {
        authorize_uri: rcsdk.platform().authUrl({
          brandId: process.env.RC_APP_BRAND_ID, // optional
          redirectUri: process.env.RC_APP_REDIRECT_URL // optional if 1 configured
        }),
        redirect_uri: process.env.RC_APP_REDIRECT_URL,
        token_json: token_json,
        callLog_uri: process.env.CALL_LOG_URL,
        data: that.callLogData,
        callLogSize: that.callLogData.length,
        dataRequested:true
      });
    }).catch(function (e) {
      conole.log('Error: in getting call logs\n\n' + e.message);
      thatRes.render('index', {
        authorize_uri: rcsdk.platform().authUrl({
          brandId: process.env.RC_APP_BRAND_ID, // optional
          redirectUri: process.env.RC_APP_REDIRECT_URL // optional if 1 configured
        }),
        redirect_uri: process.env.RC_APP_REDIRECT_URL,
        token_json: token_json,
        callLog_uri: process.env.CALL_LOG_URL,
        error: e.message
      });
    });
  } else {
    homePageLoader(res);
  }
});

var getQueryUrl=(baseUrl,dateFrom,dateTo)=>{
return `${baseUrl}?dateFrom=${dateFrom}&dateTo=${dateTo}`;
};

var homePageLoader=(res)=>{
  token_json = getToken();
  res.render('index', {
    authorize_uri: rcsdk.platform().authUrl({
      brandId: process.env.RC_APP_BRAND_ID, // optional
      redirectUri: process.env.RC_APP_REDIRECT_URL // optional if 1 configured
    }),
    redirect_uri: process.env.RC_APP_REDIRECT_URL,
    token_json: token_json,
    callLog_uri: process.env.CALL_LOG_URL,
    dataRequested:false
  });
}
var getToken=()=>{
  var token = rcsdk.platform().auth().data();
  return token['access_token'] ? JSON.stringify(token, null, ' ') : '';
}