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
const refreshSecretText = 'supersuperSecret'; 

// RefreshToken은 주로 DB에 보관이 되지만 현재는 연결이 되지 않았으므로 리스트에 보관
let refreshTokens = [];

app.use(express.json());

app.get('/', (req,res) => {
  res.send('hi');
})


app.post('/login', (req,res) => {
  const userName = req.body.username;
  const user = {name: userName};

  // // jwt를 이용해서 토큰 생성하기 payload + secretText
  // const accessToken = jwt.sign(user, secretText);
  // res.json({accessToken : accessToken});

  // 유효기간 추가
  const accessToken = jwt.sign(user, secretText, {expiresIn: '30s'});
  
  // jwt를 이용하여 refreshToken 생성
  const refreshToken = jwt.sign(user, refreshSecretText, {expiresIn: '1d'});
  refreshTokens.push(refreshToken);
  
  // refreshToken을 쿠키에 넣어주기
  res.cookie('jwt', refreshToken, {
    // document.cookie를 해보면 해커들이 쉽게 탈취를 할 수 있는 구조로 되어있다
    // XSS Cross Site Scripting 공격
    // js를 사용하여 쿠키를 탈취못하도록 한 옵션이다 httpOnly
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  })
  res.json({accessToken:accessToken});
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
// accessToken 단점 한번 토큰을 탈취하면 계속 사용할 수 있다
// 그 문제를 해결하기 위해 refrashToken사용
// 토큰에 유효기간을 준다
// 사용자 입장에서 자동으로 로그아웃돼서 자주 로그인을 해야한다
// 유효기간을 길게하면 탈취된 토큰을 오랫동안 사용한다
// accessToken 유효시간은 짧게 해주며 refreshToken의 유효시간은 길게해준다

// AccessToken은 리소스에 접근하기 위해 사용되는 토큰
// Refresh Token은 기존의 클라이언트가 가지고 있는 Access Token이 만료되었을 때 Access Token을 새로 발급받기 위한 토큰



app.listen(port, (req,res) => {
  console.log(`Running on port ${port}`)
})