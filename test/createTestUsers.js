var assert = require('assert')
var fs = require('fs')
var path = require('path')
var inspect = require('eyespect').inspector()
var async = require('async')
var couchProfile = require('couch-profile')
var bcrypt = require('bcrypt-nodejs')
var rk = require('required-keys')
module.exports = function(data, callback) {
  var db
  var keys = ['remove', 'db', 'config', 'usersData']
  var err = rk.nonNullSync(data, keys)
  if (err) { return callback(err) }
  db = data.db
  var config = data.config
  var usersData = data.usersData
  inspect('creating test users')
  async.forEachSeries(
    usersData,
    function (profile, cb) {
      var createData = {
        config: config,
        profile: profile,
        db: db
      }
      create(createData, function (err, reply) {
        if (err) { return cb(err) }
        var confirmData = {
          db: db,
          profile: reply
        }
        confirmIfNeeded(confirmData, function (err, reply) {
          cb(err, reply)
        })
      })
    }, function (err) {
      if (err) { return callback(err) }
      callback()
    }
  )
}

function confirmIfNeeded(data, cb) {
  var profile = data.profile
  var db = data.db
  if (profile.confirmed) {
    return cb(null, data.profile)
  }
  profile.confirmed = true
  var id = profile._id
  var rev = profile._rev
  delete profile._rev
  db.save(id, rev, profile, function (err, reply) {
    profile._rev = reply._rev
    cb(null, profile)
  })
}
function create(data, cb) {
  var config = data.config
  var profile = data.profile
  var email = profile.email
  var db = data.db
  var createData = {
    email: email,
    password: profile.password,
    db: db,
    rounds: config.get('bcrypt:rounds')
  }
  var findData = {
    email: email,
    db: db
  }
  couchProfile.findProfile(findData, function (err, profileReply) {
    if (err) { return cb(err) }
    if (profileReply) {
      var result = bcrypt.compareSync(profile.password, profileReply.hash)
      if (result) {
        return cb(null, profileReply)
      }
    }
    var removeData = {
      db: db,
      profile: profileReply
    }
    removeIfNeeded(removeData, function (err, reply) {
      if (err) { return cb(err) }
      couchProfile.getOrCreateProfile(createData, function (err, reply) {
        if (err) {
          return cb(err)
        }
        cb(null, reply)
      })
    })
  })
}


function removeIfNeeded(data, callback) {
  if (!data.profile) {
    return callback();
  }
  var db = data.db
  var email = data.email
  db.view('user_profile/byEmail', {}, function (err, docs) {
    if (err) { return callback(err) }
    if (docs.length === 0) {
      return callback()
    }
    async.forEachSeries(
      docs,
      function (doc, cb) {
        var id = doc.value._id
        var rev = doc.value._rev
        db.remove(id, rev, cb)
      }, callback)
  })
}
