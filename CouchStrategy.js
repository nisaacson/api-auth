var bcrypt = require('bcrypt-nodejs')
var couchProfile = require('couch-profile')
var BasicStrategy = require('passport-http').BasicStrategy
module.exports = function (data) {
  var db = data.db
  var strategy = new BasicStrategy({}, function(email, password, done) {
    var findData = {
      email: email,
      db: db
    }
    couchProfile.findProfile(findData, function (err, profile) {
      if (err) { return done(err) }
      if (!profile) {
        return done()
      }
      var hash = profile.hash
      bcrypt.compare(password, hash ,function (err, reply) {
        if (err) { return done(err) }
        if (!reply) {
          return done()
        }
        done(null, profile)
      })
    })
  })
  return strategy
}
