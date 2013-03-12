/**
 * The auth module implements the functions needed by the Passport module to
 * control access
 */
var should = require('should');
var couchProfile = require('couch-profile')
var CouchStrategy = require('./CouchStrategy.js')
var rk = require('required-keys');
module.exports = function (data) {
  var keys = ['passport', 'config', 'db']
  var err = rk.truthySync(data, keys)
  should.not.exist(err, 'error loading auth, missing key: ' + JSON.stringify(err, null, ' '))
  var config = data.config
  var db = data.db
  var passport = data.passport
  var couchStrategy = CouchStrategy(data)
  passport.use('basic', couchStrategy)
  passport.serializeUser(function(user, done) {
    done(null, user.email)
  })
  passport.deserializeUser(function(email, done) {
    var profileData = {
      email: email,
      db: db
    }
    couchProfile.findProfile(profileData, function (err, profile) {
      if (err) { return done(err) }
      done(null, profile)
    })
  })
}
