var express = require('express');
var got = require('got');
let Parser = require('rss-parser');
var router = express.Router();
let parser = new Parser();

var deviceList;
var devicelUrls;
var allData;
var iPhonesList = new Set();
var versionList = new Set();
var qd = new Date();
var qtr = new Date();
qtr.setMonth(qd.getMonth() - 3);
var months = ['0','Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];


const getVersions = (async () => {
  let feed = await parser.parseURL('https://ipsw.me/timeline.rss');
  var vSet = [];
  var vNumber = [];

  feed.items.forEach(item => {
    var update = item.title.split(" ");
    var lDate = item.pubDate.slice(item.pubDate.indexOf(" ") + 1, item.pubDate.length - 13);
    if (update[1] == "OTA") {
      update.splice(0, 1);
    }
    var major = update[1].slice(0, update[1].indexOf("."));
    update.splice(2, 2);
    var dd = new Date(lDate);
    if (update[0] == "iOS" && (new Date(lDate) > qtr) && (parseInt(major, 10) > 12)) {
      if (vNumber.indexOf(update[1]) == -1) {
        vNumber.push(update[1]);

        vSet.push({ device: update[0], number: update[1], date: (dd.getDate() + "/" + (dd.getMonth() + 1) + "/" + dd.getFullYear()) });
      }
    }
  });
  versionList = vSet;
  //console.log(versionList);
  return vSet;
})();

const getDevices = (async () => {
  const body = await got.post('https://api.ipsw.me/v4/devices', {}).json();
  let newBody = body.map(device => ({
    id: device['identifier'],
    name: device['name']
  }));

  var iphones = newBody.filter(function (el) {
    var m = el['id'].slice(6, 8);
    if (m.includes(",")) {
      m = m.slice(0, 1)
    }
    return el['id'].includes("iPhone") && m > 7 && !(el['name'].includes("Global")) && !(el['name'].includes("China"))
  });
  deviceList = body;
  iPhonesList = iphones;
  return iphones;
})();


const getUrls = (async () => {
  await Promise.all([getVersions, getDevices]);
  const body = await got.post(`https://api.ipsw.me/v4/ipsw/${versionList[0].number}`, {}).json();
  let newBody = body.map(device => ({
    id: device['identifier'],
    url: device['url']
  }));
  var iphones = newBody.filter(function (el) {
    var m = el['id'].slice(6, 8);
    if (m.includes(",")) {
      m = m.slice(0, 1)
    }

    return el['id'].includes("iPhone") && m > 7
  });
  //console.log(iphones);

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
  //console.log(op);
  allData = op;
  let result = op;

  var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };
  var groubedByTeam = groupBy(result, 'url');
  Object.keys(groubedByTeam).forEach(function(category){

    console.log(`Version ${category}:`);
     groubedByTeam[category].forEach(function(memb,i){
           console.log(`---->${i+1}. ${memb.name}.`)
    })
}); 
  //console.log(groubedByTeam.items);

  //console.log(result);
})();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('show', { versions: versionList[0].number, verdate: versionList[0].date, devices: allData, months: months });
});


module.exports = router;
