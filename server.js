const express = require('express');
const app = express();
const mongo = require('mongodb').MongoClient;
const auth = require('./app/auth.js');
const routes = require('./app/routes.js');
const session = require('express-session');
const passport = require('passport');
const sessionStore = new session.MemoryStore();

app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));

app.set('view engine', 'pug');

mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) console.log('Database error: ' + err);
  
    db.collection('picterest_user').createIndex({username: 1}, {unique: true});
  
    auth(app, db);
    routes(app, db);
  
    const listener = app.listen(process.env.PORT, function() {
      console.log('Your app is listening on port ' + listener.address().port);
    });
});
