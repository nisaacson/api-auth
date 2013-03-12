var passport = require('passport');
var should = require('should');
var portFinder = require('portfinder')
var http = require('http')
var request = require('request')
var inspect = require('eyespect').inspector({maxLength:10820});
var express = require('express')
var authLib = require('../index')
var assert = require('assert')
var dbLib = require('./db')
var fs = require('fs')
var path = require('path')
var configFilePath = path.join(__dirname, 'config.json')
assert.ok(fs.existsSync(configFilePath), 'config file not found at path: ' + configFilePath)
var config = require('nconf').env().argv().file({file: configFilePath})
var createTestUsers = require('./createTestUsers')
describe('Api Auth', function () {
  var role = 'middlewareTestServer'
  var app, server, port, db

  var usersData = [
    {
      email: 'foo@example.com',
      password: 'fooPassword'
    },
    {
      email: 'bar@example.com',
      password: 'barPassword'
    }
  ]
  var userData1 = usersData[0]
  before(function (done) {
    this.timeout('10s')
    portFinder.getPort(function (err, portReply) {
      should.not.exist(err)
      should.exist(portReply)
      port = portReply
      app = express()
      app.use(passport.initialize());
      app.use(app.router);
      server = http.createServer(app)
      server.listen(port)
      dbLib(config, function (err, dbReply) {
        should.not.exist(err)
        should.exist(dbReply)
        db = dbReply
        var authData = {
          config: config,
          db: db,
          passport: passport
        }
        authLib(authData)
        setRoutes(app)

        var testUserData = {
          db: db,
          remove: false,
          config: config,
          usersData: usersData
        }
        createTestUsers(testUserData, function (err) {
          should.not.exist(err)
          done()
        })
      })
    })
  })
  after(function () {
    server.close()
  })
  it('should allow anonymous requests to unauthenticated routes', function (done) {
    var url = 'http://localhost:'+port + '/unauthenticated'
    request(url, function (err, res, body) {
      should.not.exist(err)
      res.statusCode.should.eql(200)
      done()
    })
  })
  it('should reject anonymous requests to authenticated routes', function (done) {
    var url = 'http://localhost:'+port + '/authenticated'
    request(url, function (err, res, body) {
      should.not.exist(err)
      res.statusCode.should.eql(401)
      done()
    })
  })

  it('should allow authenticated requests to authenticated routes', function (done) {
    this.timeout('10s')
    this.slow('5s')
    var email = userData1.email
    var password = userData1.password
    var base64cred = new Buffer(email + ":" + password).toString("base64");
    var authHeader = "Basic " + base64cred;
    var headers = { authorization: authHeader }

    var url = 'http://localhost:'+port + '/authenticated'
    var opts = {
      headers: headers,
      url: url
    }
    request(opts, function (err, res, body) {
      should.not.exist(err)
      res.statusCode.should.eql(200)
      done()
    })
  })
})


function setRoutes(app) {
  var authWare = passport.authenticate('basic', {session:false, failureRedirct: 'http://www.google.com'});
  app.get('/authenticated', authWare, function (req, res) {
    res.end('this request was authenticated')
  })
  app.get('/unauthenticated', function (req, res) {
    res.end('this request was not unauthenticated')
  })
}
