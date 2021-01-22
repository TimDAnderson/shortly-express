const parseCookies = (req, res, next) => {
  let cookieHeader = req.header('Cookie');
  if (!cookieHeader) {
    req.cookies = {};
    next();
    return;
  }

  let cookieArray = cookieHeader.split(';');
  let cookieObject = {};
  let unnamedCookies = 0;
  for (let i = 0; i < cookieArray.length; i++) {
    let tempArray = cookieArray[i].split('=');
    if (tempArray.length === 1) {
      cookieObject[unnamedCookies] = tempArray[0].trim();
      unnamedCookies++;
    } else {
      cookieObject[tempArray[0].trim()] = tempArray[1].trim();
    }
  }

  // check if shortlyid is not defined, and if unnamed cookie 0 is defined, then shortlyid should be unnamed cookie 0
  req.cookies = cookieObject;
  next();
};

module.exports = parseCookies;



