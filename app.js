const http = require("http");

const hostname = "0.0.0.0";
const port = 8080;
let myHideData = false; // true to hide location and ID data

let myNoShow = []; // key to values to hide!
let myNoShow2 = [
  "app_eui",
  "dev_eui",
  "lat",
  "long",
  "name",
  "devaddr",
  "downlink_url",
  "id",
  "organization_id",
  "uuid"
];
let myHTML = `<html><head><meta http-equiv='refresh' content='20' /></head><body> 
  <h6>Version 0.0.5</h6>
  <h3 align=center> Hello Helium Device: Not for Production!</h3>
  Anyone with the URL can see your device and everything presented here<br><br>
  Table of connected devices<br>
  <table border=1>
  <tr><th> Device</th><th>Raw Payload</th><th> Converted Payload </th><th>  Date:Time </th><th>  First Hotspot </th> <th>  RSSI </th>  </tr>

`;
let myLastProperty;
let myGoogleMapURLString = "";

if (myHideData) {
  myNoShow = myNoShow2;
}

function myDecoder(myRawPayload) {
  // default base64 decoding
  let myReturn = Buffer.from(myRawPayload, "base64");

  // or put your own decoder here

  return myReturn;
}

function myJsonToHtml(json, myNoNoShow, myHideTrueFalse) {
  let myOutput = "<ul>";
  for (const property in json) {
    if (
      typeof json[property] === "string" ||
      typeof json[property] === "number" ||
      typeof json[property] === "boolean" ||
      typeof json[property] === "bigint"
    ) {
      if (myNoNoShow.includes(property)) {
        myOutput += "<li>" + property + " : *******************";
      } else {
        myOutput += "<li>" + property + " : " + json[property];
        // specific properties tested here
        if (property == "payload") {
          myOutput +=
            "<br> Encoder converted: <b>" + myDecoder(json[property]) + "</b>";
        }
        if (property == "id" && myLastProperty == "hold_time") {
          myOutput +=
            "  <a target='_blank' href='https://explorer.helium.com/hotspots/" +
            json[property] +
            "'>Helium Link</a><br>";
        }
        if (property == "reported_at") {
          myOutput += ", Date: (PST) " + timeConverter(json[property]);
        }
        if (property == "lat") {
          myGoogleMapURLString += json[property] + ",";
        }
        if (property == "long") {
          myGoogleMapURLString += json[property] + "/";
        }

        if (property == "payload") {
          console.log("myGoogleMapURLString");
          console.log(myGoogleMapURLString);
          let myGoogleURL =
            "https://www.google.com/maps/dir/" + myGoogleMapURLString + ",11z";
          console.log("myGoogleURL");
          console.log(myGoogleURL);

          myOutput +=
            " <br> <a target='_blank' href='" +
            myGoogleURL +
            "'>Google Maps</a><br>";
        }
      }
      myLastProperty = property; // so we can compare where in the JSON we are
    } else if (typeof json[property] == "object" && json[property] != null) {
      myOutput += "<br>" + property + myJsonToHtml(json[property], myNoNoShow); // recursive call this
    } else if (Array.isArray(json[property])) {
      myOutput += "<br><ul>" + property;
      for (let i = 0; i < json[property].length; i++) {
        myOutput += property + "[" + i + "]";
        myOutput += myJsonToHtml(json[property][i], myNoNoShow); // recursive call this
      }
      myOutput += "</ul>";
    }
  }
  myOutput += "</ul>";
  return myOutput;
}

function timeConverter(UNIX_timestamp) {
  // var a = new Date(UNIX_timestamp * 1000);
  //var timezone = new Date().getTimezoneOffset();
  //console.log(timezone);
  //var a = new Date(UNIX_timestamp);
  var a = new Date(parseInt(UNIX_timestamp) - 28800 * 1000); // convert GMT to PST
  // var a = UNIX_timestamp;
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time =
    date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
  return time;
}

const server = http.createServer((req, res) => {
  console.log(`\n${req.method} ${req.url}`);
  console.log(req.headers);

  req.on("data", function (chunk) {
    console.log(" " + chunk); // Logs everything coming in

    myGoogleMapURLString = "";
    let data = JSON.parse(chunk);
    //myHTML = myJsonToHtml(data, myNoShow);
    // myHTML = data.app_eui;
    // myHTML = data.app_eui;
    // myHTML += data.name;
    myHTML +=
      "<tr><td> " +
      data.name +
      " </td><td> " +
      data.payload +
      " </td><td> " +
      myDecoder(data.payload) +
      " </td><td> " +
      timeConverter(data.reported_at) +
      " </td><td> " +
      "  <a target='_blank' href='https://explorer.helium.com/hotspots/" +
      data.hotspots[0].id +
      "'>" +
      data.hotspots[0].name +
      "</a><br>" +
      
      " </td><td> " +
      data.hotspots[0].rssi +
      " </td></tr> ";
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");

  res.write(myHTML);
  res.end("</table></body></html>");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
