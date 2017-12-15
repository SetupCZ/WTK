const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
// const bcrypt = require('bcrypt')
let userSettings = require('./wtk/userSettings.json')

// const User = require('./models/user')
// userSettings[validatedData.wtkLoginName]
exports.generateTokens = async (user, SECRET, SECRET2) => {
  console.log('inGenerateTokens');
  const accessToken = jwt.sign(
    { user },
    SECRET,
    { expiresIn: "1d" }
  )

  const refreshToken = jwt.sign(
    { user: { id: user.id } },
    SECRET2,
    { expiresIn: "7d" }
  )
  return [accessToken, refreshToken]
}

exports.refreshTokens = async (accessToken, refreshToken, SECRET, SECRET2) => {
  console.log('inRefreshTokens');
  let userId

  try {
    const { user: { id } } = jwt.decode(refreshToken)
    userId = id
  } catch (err) {
    console.log(err);
    return {}
  }
  if (!userId) return {}
  console.log('here');

  const user = await this.getUser(userId) // await User.findOne({ where: { id: userId }, raw: true });

  if (!user) return {}

  const refreshSecret = user.password + SECRET2;

  try {
    jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    console.log(err);
    return {};
  }
  const [newAccessToken, newRefreshToken] = await this.generateTokens(user, SECRET, refreshSecret);

  return [
    newAccessToken,
    newRefreshToken,
    user
  ]
}

exports.getTokens = (req) => {
  console.log('inGetTokens');
  if (req.cookies.Authorization &&
    req.cookies.Authorization.split(' ')[0] === 'Bearer') {
    return [
      req.cookies.Authorization.split(' ')[1],
      req.cookies.refreshToken
    ]
  }
  else if (req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer') {
    return [
      req.headers.authorization.split(' ')[1],
      req.headers.refreshToken
    ]
  }
  return [];
}
exports.setTokens = async (accessToken, refreshToken, userId, res) => {
  console.log('inSetTokens');
  res.cookie('Authorization', `Bearer ${accessToken}`, { httpOnly: true }) //secure:true > uses https
  res.cookie('accessToken', `${accessToken}`, { httpOnly: true })
  res.cookie('refreshToken', `${refreshToken}`, { httpOnly: true })
  res.cookie('userForWeb', `${userId}`, { })
  // save user
  const user = await this.getUser(userId)
        user.refreshToken = refreshToken
  this.setUser(userId, user)
  console.log('here');
  return 
}
exports.getUser = async (id) => {
  return userSettings[id]
}
exports.setUser = async (id, userData) => {
  userSettings[id]=userData
}