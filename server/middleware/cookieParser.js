const parseCookies = (req, res, next) => {
  console.log(req.header('Cookie'));
  let cookieHeader = req.header('Cookie');
  if (!cookieHeader) {
    req.cookies = {};
    next();
    return;
  }

  let cookieArray = cookieHeader.split(';');
  let cookieObject = {};
  for (let i = 0; i < cookieArray.length; i++) {
    let tempArray = cookieArray[i].split('=');
    cookieObject[tempArray[0].trim()] = tempArray[1].trim();
  }
  req.cookies = cookieObject;
  next();
};

module.exports = parseCookies;



