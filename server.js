const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

app.set('view engine', 'ejs');

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + 'public'));
app.use(passport.initialize());
app.use(
    session({
        secret: 'qwer1234',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 60 * 60 * 1000 },
        store: MongoStore.create({
            mongoUrl: 'DB 연결 주소를 여기에 입력해주세요!',
            dbName: 'opensource_project',
        }),
    })
);
app.use(passport.session());

let db;
const url = 'DB 연결 주소를 여기에 입력해주세요!';
new MongoClient(url)
    .connect()
    .then((client) => {
        console.log('Connection to database was successful.');
        db = client.db('opensource_project');

        app.listen(8080, () => {
            console.log('Server running at http://localhost:8080');
        });
    })
    .catch((err) => {
        console.log(err);
    });

app.get('/', (req, res) => {
    res.send('메인 페이지입니다.');
});

// DB에 저장되어 있는 모든 user에 대한 정보를 확인하기 위한 API
app.get('/list', async function (req, res) {
    let result = await db.collection('user').find().toArray();
    res.send(result);
});

// 회원 가입 form을 전송하는 API
app.get('/join', (req, res) => {
    res.render('join_form.ejs');
});

// 회원 가입 요청을 처리하는 API
app.post('/join', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let password2 = req.body.password2;
    let name = req.body.name;
    let gender = req.body.gender;
    let birthYear = req.body.birth_year;
    let birthMonth = req.body.birth_month;
    let birthDay = req.body.birth_day;

    if (req.body.agree != 'on') {
        res.send('개인정보 수집 방침에 동의해주세요.');
    } else {
        if (password != password2) {
            res.send('비밀번호 확인이 일치하지 않습니다.');
        } else {
            db.collection('user').insertOne({
                username: username,
                password: password, // 이후, 보안을 위한 해시를 적용할 필요있음
                name: name,
                gender: gender,
                birthYear: birthYear,
                birthMonth: birthMonth,
                birthDay: birthDay,
            });
            res.send('회원가입 완료');
        }
    }
});

// passport 라이브러리 사용하여 log-in 처리
passport.use(
    new LocalStrategy(async (userId, password, cb) => {
        let result = await db.collection('user').findOne({ username: userId });
        if (!result) {
            return cb(null, false, { message: '아이디가 존재하지 않습니다.' });
        }
        if (result.password == password) {
            return cb(null, result);
        } else {
            return cb(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
    })
);

passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, { id: user._id, username: user.username });
    });
});

passport.deserializeUser((user, done) => {
    process.nextTick(() => {
        return done(null, user);
    });
});
//

// 로그인 폼을 요청하는 API
app.get('/log-in', (req, res) => {
    res.render('log_in.ejs');
});

// 로그인 요청을 처리하는 API
app.post('/log-in', (req, res, next) => {
    passport.authenticate('local', (error, user, info) => {
        if (error) return res.status(500).json(error);
        if (!user) return res.status(401).json(info.message);
        req.logIn(user, (err) => {
            if (err) return next(err);
            res.redirect('/');
        });
    })(req, res, next);
});
