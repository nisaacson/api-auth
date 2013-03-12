var passport = require('passport');
var should = require('should');
var portFinder = require('portfinder')
var http = require('http')
var request = require('request')
var inspect = require('eyespect').inspector({maxLength:10820});
var express = require('express')
describe('Api Auth', function () {
  var role = 'middlewareTestServer'
  var app, server, port
  before(function (done) {
    portFinder.getPort(function (err, portReply) {
      should.not.exist(err)
      should.exist(portReply)
      port = portReply
      app = express()
      app.use(passport.initialize());
      app.use(app.router);
      server = http.createServer(app)
      server.listen(port)
      setRoutes(app)
      done()
    })
  })
  after(function () {
    server.close()
  })
  it('should allow anonymous requests to unauthenticated routes', function (done) {
    var url = 'http://localhost:'+port + '/unauthenticated'
    request(url, function (err, res, body) {
      should.not.exist(err)
      res.statusCode.should.eql(401)
      inspect(body,'body')
    })
  })
  it('should reject anonymous requests to authenticated routes', function (done) {
    var url = 'http://localhost:'+port + '/authenticated'
    request(url, function (err, res, body) {
      should.not.exist(err)
      res.statusCode.should.eql(401)
      inspect(body,'body')
    })
  })
})


function setRoutes(app) {
  var authWare = passport.authenticate('basic', {session:false});
  app.get('/authenticated', authWare, function (req, res) {
    res.end('authenticated')
  })
  app.get('/unauthenticated', function (req, res) {
    res.end('unauthenticated')
  })
}
