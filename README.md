Demo Project to get Call Logs
==========================================================

## Overview

This is a demo project in which we do a 3 Leg authentication and then we load the call logs for the logged in user.

## Installation

### Via NPM

```bash
$ git clone https://github.com/akaflay/Demo.git
$ cd demo
$ npm install
```

## Configuration

Edit the `.env` file to add your application key and application secret.Currently it has my config values

```bash
$ cd demo
$ vi .env and update the configs
```

In the [Developer Portal](http://developer.ringcentral.com/), ensure the redirect URI in your config file has been entered in your app configuration. By default, the URL is set to the following for this demo:

```
http://localhost:8080/callback.html
```

#### Using TLS

If you set the following parameters, you can start this demo using TLS. Be sure you are using HTTPS for your redirect URI.

| Property | Information |
|----------|-------------|
| `MY_APP_TLS_ENABLED` | Set to `1` for HTTPS and `0` for HTTP |
| `MY_APP_TLS_PRIVATE_KEY` | Set to path to PEM file for private key |
| `MY_APP_TLS_CERTIFICATE` | Set to path to PEM file for certificate |

## Usage

Open the web page:

```bash
$ npm start
```

Go to the URL:

```
http://localhost:8000
````

Then click the button Login with Ring Central. It will open a popup in whch you need to allow access to call logs.Now the index page will have a Load call History button.Click on this to load the call history.  
