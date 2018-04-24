const fs = require('fs');
const cld = require('cld');
let lines;
let json;

json = {
  "type": "schema",
  "id": "schema--id",
  "name": "emailschema",
  "description": "A general schema for describing an email",
  "created": new Date(),
  "modified": new Date(),
  "version": 1,
  "object": {
    "object_type": "email",
    "email_attributes": {
      "subject": {
      },
      "recipient_data": {
        "items": {
          "recipient": {
            "recipient_category": "To"
          }
        }
      },
      "sender": {
      }
    },
    "link": {},
  },
  "required": ["sender", "recipient", "created", "body", "subject", "email_language"]
};


function detectBody(lines) {
  let body = [];
  let size = 0;
  let email_format;
  let language;
  lines.forEach((line) => {
    if (line.includes("<!DOCTYPE html>")) {
      size = 1
    }
    if (line.includes("</html>")) {
      size = 0
      body.push(line)
    }
    if (size == 1) {
      body.push(line)
    }
  })
  body = body.toString().replace(',', '\n');
  json.object.email_attributes.body = body;
  json.object.email_attributes.email_size = unescape(encodeURIComponent(body)).length;
  cld.detect(body, function (err, result) {
    language = result.languages[0].name;
    json.object.email_attributes.email_language = language.toLowerCase()
  });
}


function treatSubject(lines) {
  lines.forEach((line) => {
    if (line.includes("Subject: ")) {
      json.object.email_attributes.subject.type = line.replace("Subject: ", "");
      json.object.email_attributes.subject.format = "text";
      json.object.email_attributes.subject.characters = line.replace("Subject: ", "").length;
      cld.detect(line, function (err, result) {
        language = result.languages[0].name;
        json.object.email_attributes.subject.language = language.toLowerCase()
      });
    }
  })
}


function treatRecipient(lines) {
  lines.forEach((line) => {
    if (line.includes("Delivered-To: ")) {
      json.object.email_attributes.recipient_data.recipient_number = line.replace("Delivered-To: ", "").split(" ").length;
      let emails = line.replace("Delivered-To: ", "").split(" ");
      json.object.email_attributes.recipient_data.items.recipient.address = emails;
      let names = []
      emails.forEach(e => {
        names.push(e.split("@")[0])
      })
      json.object.email_attributes.recipient_data.items.recipient.name = names;
    }
  })
  if (lines[3].includes("by")){
    let ipLine= lines[3].split(" ");
    json.object.email_attributes.recipient_data.items.recipient.ip = ipLine[ipLine.length-1].replace("[","").replace("]","").replace(")","").replace("(","")
  }
}


function treatSender(lines) {
  lines.forEach((line) => {
    if (line.includes("From: ")) {
      let sender = line.replace("From: ", "").replace(/"/g," ").split(" ");
      sender.forEach( s=> {
        if (s.includes("@")){
          json.object.email_attributes.sender.address= s.replace(">","").replace("<","");
          sender.pop(s)
          json.object.email_attributes.sender.name= sender;
        }
      })
    }
    if (line.includes("Received: from ")) {
        let ipLine =line.split(' ')
        let ip = ipLine[ipLine.length-1].replace("[","").replace("]","").replace(")","")
        json.object.email_attributes.sender.ip= ip
    }
  })
}

function detectLink(lines) {
  let urls = [];

  lines.forEach((line) => {
    if (line.includes("http://")) {
      let l = line.split('"').join(' ').split(" ");
      l.forEach(url => {
        if (url.includes("http://")) {
          urls.push(url)
        }
      })
    }
  });

  json.object.link.links = urls;
}

fs.readFile('email1.txt', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }

  lines = data.replace(/"/g, '').split('\n');
  detectBody(lines);
  treatSubject(lines);
  treatRecipient(lines);
  treatSender(lines);
  detectLink(lines);

  //console.log(JSON.stringify(json))

  console.log(JSON.stringify(json))

})







