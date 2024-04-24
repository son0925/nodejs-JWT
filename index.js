const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const port = 4000;
const app = express();

const posts = [
  {
    username: 'John',
    title: 'Post 1'
  },
  {
    username: 'Han',
    title: 'Post 2'
  }
];

const secretText = 'superSecret';
const refreshSecretText = 'supersuperSecret'; 

// Refresh Token을 저장하는 배열
let database = [];

// Express 미들웨어 설정
app.use(express.json());
app.use(cookieParser());

// 기본 경로에 대한 GET 요청 핸들러
app.get('/', (req,res) => {
  res.send('hi');
});

// 로그인 요청 핸들러
app.post('/login', (req,res) => {
  const userName = req.body.username;
  const user = {name: userName};

  // AccessToken 발급 (20초 유효)
  const accessToken = jwt.sign(user, secretText, {expiresIn: '20s'});
  // RefreshToken 발급 (1일 유효)
  const refreshToken = jwt.sign(user, refreshSecretText, {expiresIn: '1d'});
  // RefreshToken을 데이터베이스에 저장
  database.push(refreshToken);
  
  // 클라이언트에게 AccessToken과 함께 RefreshToken을 쿠키로 전송
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.json({accessToken: accessToken});
});

// 게시물 요청 핸들러 (인증 필요)
app.get('/posts', authMiddleware, (req,res) => {
  res.json(posts);
});

// AccessToken 갱신 요청 핸들러
app.get('/refresh', (req,res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(403);

  const token = cookies.jwt;

  // RefreshToken의 유효성 검사
  jwt.verify(token, refreshSecretText, (err, user) => {
    if (err) return res.sendStatus(403);

    // 데이터베이스에서 RefreshToken 검사
    if (!database.includes(token)) return res.sendStatus(403);
    
    // AccessToken 재발급
    const accessToken = jwt.sign({name: user.name}, secretText, {expiresIn : '20s'});
    res.json({accessToken: accessToken});
  });
});

// 토큰 인증 미들웨어
function authMiddleware(req,res,next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  // AccessToken의 유효성 검사 및 유저 정보 추출
  jwt.verify(token, secretText, (err,user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
