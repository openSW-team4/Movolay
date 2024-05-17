const express = require('express');
const app = express();

const { MongoClient, ObjectId } = require('mongodb');

let db;
const url = '주소를 여기에 입력해야 합니다.';
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

//sample user의 id를 가져오는 예시 코드
app.get('/', async function (req, res) {
    let result = await db.collection('user').find().toArray();
    console.log('아이디: ', result[0].userId);
    console.log('패스워드: ', result[0].password);
});
