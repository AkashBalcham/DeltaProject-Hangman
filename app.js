const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const secure = 10;

let user;
let player1;
let player2;
let maxRounds;
let prevWord;
let p1_score = 0;
let p2_score = 0;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '*1Ndr0med1_'
});
connection.connect((err) => {
    if(err) {
        console.log(err);
        console.log('Error with db connection');
    } else {
        console.log('Conneted to db successfully');
        connection.query('USE delta_project', (err, result) => {
            if(err) {
                console.log(err);
            } else {
                app.listen(3000);
            }
        })
    }
})

app.set('view engine', 'ejs');
app.use(express.static('public/Images'));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('first', { page: "Welcome" })
})

app.get('/sign-up', (req, res) => {
    let msg = req.query.msg || '';
    res.render('sign-up', { page: "Sign Up", msg })
})

app.post('/sign-up', (req, res) => {
    let info = req.body;
    let username = info.username;
    let password = info.password;
    connection.query('SELECT * FROM users', (err, result) => {
        if(err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                count = 0;
                for(let i=0; i<result.length; i++) {
                    if(result[i].username === username) {
                        res.redirect(`/sign-up?msg={Username exists}`)
                    }
                }
            } else {
                bcrypt.genSalt(secure, function(err, salt) {
                    bcrypt.hash(password, salt, function(err, hash) {
                        connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err, result) => {
                            if(err) {
                                console.log(err);
                            } else {
                                res.redirect('/login');
                            }
                        })
                    })
                })
            }
        }
    })
})

app.get('/login', (req, res) => {
    let msg = req.query.msg || ''
    res.render('login', { page: "login", msg })
})

app.post('/login', (req, res) => {
    let info = req.body;
    let username = info.username;
    let password = info.password;
    user = username;

    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if(err) {
            console.log(err);
        } else {
            if(result.length < 1) {
                res.redirect(`/login?msg=User does not exist`)
            } else {
                let hashedPwd = result[0].password;
                bcrypt.compare(password, hashedPwd, (err, result) => {
                    if(result) {
                        user = username;
                        res.redirect('/home')
                    } else {
                        res.redirect('/login?msg=Username and password do not match!');
                    }
                })
            }
            
        }
    })
})

app.get('/home', (req, res) => {
    let statLst = [];
    connection.query('SELECT * FROM users WHERE username = ?', [user], (err, result) => {
        if(err) {
            console.log(err);
        } else {
            statLst = result[0];
            console.log(statLst);
            res.render('home', { page: "Home", statLst, user });
        }
    })
})

app.get('/new-game', (req, res) => {
    res.render('new-game', { page: "New game", user })
})

app.get('/localMultiplayer', (req, res) => {
    let msg = req.query.msg || '';
    res.render('local-multiplayer', { page: "game setup", msg })
})

app.post('/localMultiplayer', (req, res) => {
    let data = req.body;
    console.log(data);
    maxRounds = data.rounds;
    if(maxRounds && maxRounds > 0) {
        // maxRounds = number(numRounds);
        player1 = data.player1;
        player2 = data.player2;
        res.redirect('/set/11');
    } else {
        res.redirect('/localMultiplayer?msg=Invalid number of rounds');
    }
})

app.get('/set/:num', (req, res) => {
    let data = req.params.num;
    let s = data[0];
    let g;
    
    let r = data[1];
    if(r > maxRounds) {
        // End the game
        res.render('end-game', { page: "Result", player1, player2, p1_score, p2_score })
    } else {
        if(s == '1') {
            g = '2';
            res.render('set-word', { page: "set word", setter: player1, guesser: player2, maxRounds, roundNumber: r, guesserNumber: g})
        } else {
            g = '1';
            res.render('set-word', { page: "set word", setter: player2, guesser: player1, maxRounds, roundNumber: r, guesserNumber: g})
        }
        
    }
})

app.post('/guess/:num', (req, res) => {
    let data = req.params.num;
    let g = data[0];
    let r = data[1];
    let s;
    let info = req.body;
    let word = info.setWord
    prevWord = word;
    if(r > maxRounds) {
        //end the game
        
    } else {
        if(g == '1') {
            s = '2';
            res.render('guess-word', { page: "guess word", setter: player2, guesser: player1, setterNumber: s, newRoundNumber: parseInt(r, 10)+1, prevWord, len: prevWord.length, g, s})
        } else {
            s = '1';
            res.render('guess-word', { page: "guess word", setter: player1, guesser: player2, setterNumber: s, newRoundNumber: r, prevWord, len: prevWord.length, g, s})
        }
        
    }
})

app.post('/update-scores', (req, res) => {
    const { score, gValue } = req.body;
    if (gValue == 1) {
        console.log('Player 1 just guessed');
        p1_score += score;
        console.log("Player1's current score", p1_score);
    } else {
        console.log('Player 2 just guessed');
        p2_score += score;
        console.log("Player2' current score", p2_score);
    }
})