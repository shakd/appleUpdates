let express = require('express');
let post = require('got');
let Parser = require('rss-parser');
let router = express.Router();
let parser = new Parser();

let devicelUrls;
let allData;
let iPhonesList = new Set();
let versionList = new Set();
let qd = new Date();
let qtr = new Date();
qtr.setMonth(qd.getMonth() - 3);
let months = ['0', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];


const getVersions = (async () => {
  let feed = await parser.parseURL('https://ipsw.me/timeline.rss');
  let vSet = [];
  let vNumber = [];
  feed.items.forEach(item => {
    let update = item.title.split(" ");
    let lDate = item.pubDate.slice(item.pubDate.indexOf(" ") + 1, item.pubDate.length - 13);
    if (update[1] == "OTA") {
      update.splice(0, 1);
    }
    let major = update[1].slice(0, update[1].indexOf("."));
    update.splice(2, 2);
    let dd = new Date(lDate);
    if (update[0] == "iOS" && (dd > qtr) && (parseInt(major, 10) > 12)) {
      if (vNumber.indexOf(update[1]) == -1) {
        vNumber.push(update[1]);
        vSet.push({ device: update[0], number: update[1], date: (`${dd.getDate()}/${dd.getMonth() + 1}/${dd.getFullYear()}`) });
      }
    }
  });
  versionList = vSet;
  return vSet;
})();

const getDevices = (async () => {
  const body = await post('https://api.ipsw.me/v4/devices', {}).json();
  let newBody = body.map(device => ({
    id: device['identifier'],
    name: device['name']
  }));
  let iphones = newBody.filter(function (el) {
    let m = el['id'].slice(6, 8)
    m = m.includes(",") ? m.slice(0, 1) : m
    return el['id'].includes("iPhone") && m > 7 && !(el['name'].includes("Global")) && !(el['name'].includes("China"))
  });
  iPhonesList = iphones
  return iphones
})();


const getUrls = (async () => {
  await Promise.all([getVersions, getDevices]);
  const body = await post(`https://api.ipsw.me/v4/ipsw/${versionList[0].number}`, {}).json();
  let newBody = body.map(device => ({
    id: device['identifier'],
    url: device['url']
  }));
  let iphones = newBody.filter(function (el) {
    let m = el['id'].slice(6, 8);
    m = (m.includes(",")) ? m = m.slice(0, 1) : m
    return el['id'].includes("iPhone") && m > 7
  });
  devicelUrls = iphones;
  return iphones;
})();

(async () => {
  await Promise.all([getVersions, getDevices, getUrls]);
  let op = iPhonesList.map((e, i) => {
    let temp = devicelUrls.find(el => el.id === e.id)
    if (temp.url) {
      e.url = temp.url
    }
    return e;
  })
  allData = op;
  let result = op;

  var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };
  var groubedByTeam = groupBy(result, 'url');
  Object.keys(groubedByTeam).forEach(function (category) {
    console.log(`Version ${category}:`);
    groubedByTeam[category].forEach(function (memb, i) {
      console.log(`---->${i + 1}. ${memb.name}.`)
    })
  });
})();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('show', { versions: versionList[0].number, verdate: versionList[0].date, devices: allData, months: months });
});

module.exports = router;
