const session     = require('express-session');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');

module.exports = function (app, db) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        db.collection('picterest_user').findOne(
            {id: id},
            (err, doc) => {
                done(null, doc);
            }
        );
    });
  
    passport.use(new LocalStrategy(
      function(username, password, done) {
          db.collection('picterest_user').findOne({
            username: username
          }, function(err, user) {
            if(err) {
              return done(err);
            }

            if(!user) {
              return done(null, false);
            }

            if(bcrypt.compareSync(password, user.password)) {
              return done(null, user);
            }
            return done(null, false);
          });
      }
    ));

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'https://picterest.glitch.me/auth/github/callback'
      },
      function(accessToken, refreshToken, profile, cb) {
          console.log(profile);
          db.collection('picterest_user').findAndModify(
              {_id: profile.id},
              {},
              {$setOnInsert:{
                  _id: profile.id,
                  username: profile.username                  
              }},
              {upsert:true, new: true}, //Insert object if not found, Return new object after modify
              (err, doc) => {
                  return cb(null, doc.value);
              }
          );
        }
    ));
}