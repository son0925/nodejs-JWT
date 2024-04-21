const express = require('express');
const port = 4000;
const app = express();
const jwt = require('jsonwebtoken');

const posts = [
  {
    username: 'John',
    title: 'Post 1'
  },
  {
    username: 'Han',
    title: 'Post 2'
  }
]

const secretText = 'superSecret';

app.use(express.json());


app.post('/login', (req,res) => {
  const userName = req.body.username;
  const user = {name: userName};

  // jwt를 이용해서 토큰 생성하기 payload + secretText
  const acessToken = jwt.sign(user, secretText);
  res.json({accessToken : acessToken});
})

app.get('/posts', authMiddleware, (req,res) => {
  res.json(posts);
})

// 토큰이 올때는 주로 Bearer asdfdsafe.faefewaf.eafafea 온다
function authMiddleware(req,res,next) {
  // 토큰을 request header 에서 가져오기
  const authHeader = req.headers['authorization'];
  // Bearer safasefa.fewafewafe.feawfea
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  // 토큰이 있으니 유효한 토큰인지 확인하기
  jwt.verify(token, secretText, (err,user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    // A => B req.user를 해서 B 미들웨어에서 사용할 수 있다
    next();
  }) 
}


app.listen(port, (req,res) => {
  console.log(`Running on port ${port}`)
})