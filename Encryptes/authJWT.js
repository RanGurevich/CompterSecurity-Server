const jwt = require('jsonwebtoken');

const setAuthCookie = (res, user) => {
  const token = jwt.sign({user}, process.env.JWT_SECRET, { expiresIn: '1h' });

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 3600000
  };

  res.cookie('auth_token', token, cookieOptions);
};

const authenticateToken = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, username) => {
    if (err) return res.sendStatus(403);
    req.username = username;
    next();
  });
};

module.exports = { setAuthCookie,
                  authenticateToken
                };
