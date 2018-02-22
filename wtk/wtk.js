const wtkInit = require('./routes/wtk-init');
const wtkAuth = require('./routes/wtk-auth');


module.exports = (options) => {
  const opt = getOptions(options)
  process.env.SECRET = opt.secret
  process.env.SECRET2 = opt.secret2
  return [wtkInit, wtkAuth]
}

getOptions = (options) => {
  const opt = {}
  // TODO:
  if (!options.secret)
  return opt
}
