const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = (callback) => { 
  // use request to fetch IP address from JSON API

  request.get('https://api.ipify.org/?format=json', (err, res, body) => {
    if(err){
      return callback(err, null);
    }

   // if non-200 status, assume server error
    if (res.statusCode !== 200) {
      const msg = `Status Code ${res.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    const { ip } = JSON.parse(body);

    return callback(null, ip);
  })

}

const fetchCoordsByIP = (ip, callback) => {

  request.get(`https://freegeoip.app/json/${ip}`, (err, res, body) => {
    // inside the request callback ...
    // error can be set if invalid domain, user is offline, etc.
    if (err) {
      callback(err, null);
      return;
    }
    // if non-200 status, assume server error
    if (res.statusCode !== 200) {
      const msg = `Status Code ${res.statusCode} when fetching coordinates for IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    callback(null, body);
    return;
  })
}

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function({ latitude, longitude}, callback) {
  request.get(`http://api.open-notify.org/iss-pass.json?lat=${latitude}&lon=${longitude}`, (err, res, body)=>{
     if (err) {
      callback(err, null);
      return;
    }
    // if non-200 status, assume server error
    if (res.statusCode !== 200) {
      const msg = `Status Code ${res.statusCode} when fetching coordinates for IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    callback(null, body);
    return;
  })
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results. 
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */ 
const nextISSTimesForMyLocation = function(callback) {

  fetchMyIP((err1, ip) => {
    if (err1) {
      return callback(err1, null);
    }
  
    fetchCoordsByIP(ip, (err2, data) => {
      if (err2) {
        return callback(err2, null)
      }
  
      const {latitude, longitude} = JSON.parse(data);
  
      fetchISSFlyOverTimes({latitude, longitude}, (err3, data) => {
        if (err3) {
          return;
        }
  
        const result = JSON.parse(data);

        callback(null, result.response)
      })
    });
  });

}


module.exports = { nextISSTimesForMyLocation };