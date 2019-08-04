const passport = require('passport');
const cors = require('cors')
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

var session;

module.exports = function(app, db) {
    app.use(cors());
    app.use(bodyParser());

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };

    app.route('/auth/github')
        .get(passport.authenticate('github'));

    app.route('/auth/github/callback')
        .get(passport.authenticate('github', {
            failureRedirect: '/'
        }), (req, res) => {
            session = req.user;
            console.log(session);
            res.redirect('/');
        });

    app.route('/')
        .get((req, res) => {
            let pics = [];
            let username = null;

            let searchObject = {};
      
            console.log(session);

            // CHECK THIS
            // if username is defined filter result by it
            if (session) {
                searchObject = {
                    username: session.username
                };
                username = session.username;
                console.log('searching by:' + session.username);
            } else {
                console.log('searching all');
            }

            db.collection('picterest_pic').find(searchObject).toArray((err, data) => {
                if (err) {
                    console.log({
                        error: err.code
                    });
                    return;
                }
                data.forEach(elem => {
                    pics.push({
                        description: elem.description,
                        link: elem.link,
                        username: elem.username
                    });
                });

                res.render(process.cwd() + '/views/pug/index', {
                    username: username,
                    pics: pics
                });
            });
        });

    app.route('/login')
        .post(passport.authenticate('local', {
            failureRedirect: '/'
        }), (req, res) => {
            session = req.user;
            res.redirect('/');
        });

    app.route('/register')
        .get((req, res) => {
            res.render(process.cwd() + '/views/pug/register');
        });

    app.route('/signup')
        .post((req, res) => {
            db.collection('picterest_user').insert({
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, 12)
            }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(`could not sign up, error code ${err.code}`);
                    return;
                }

                res.redirect('/');
            });
        });

    app.route('/savepic')
        .post((req, res) => {
            console.log(session);
            db.collection('picterest_pic').insert({
                description: req.body.description,
                link: req.body.link,
                username: session.username
            }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(`could not save pic, error code ${err.code}`);
                    return;
                }

                res.redirect('/');
            });
        });

    app.route('/logout')
        .get((req, res) => {
            req.logout();
            session = null;
            res.redirect('/');
        });

    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}