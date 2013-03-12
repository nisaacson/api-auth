var inspect = require('eyespect').inspector()
var cradle = require('cradle')
module.exports = function (config, cb) {
  var couch = config.get('couch')
  var host = couch.host
  var protocol = couch.protocol
  var fullHost = protocol + '://'+host
  var port = couch.port
  var database = couch.database
  var opts = {
    cache: false,
    raw: false
  }

  var username = config.get('couch:username')
  var password = config.get('couch:password')

  if (username) {
    opts.auth = {
      username: username,
      password: password
    }
  }

  var c = new(cradle.Connection)(fullHost, port, opts)
  var db = c.database(database)
  db.exists(function (err, exists) {
    if (err) { return cb(err) }
    if (!exists) {
      cb('database does not exist: ' + database)
    }
    cb(null, db)
  })
}
