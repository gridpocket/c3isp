/*
 * File: EmailToJSON.js
 * File Created: Thursday, 3rd May 2018 5:08:32 pm
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Friday, 4th May 2018 1:06:10 pm
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Copyright 2018 GridPocket, GridPocket
 */

const fs = require('fs');
const cld = require('cld');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const router = express.Router();
let email;

let json;

function detectBody(lines) {
  let body = [];
  let size = 0;
  let language;
  lines.forEach((line) => {
    if (line.includes('Message-ID: ')) {
      json.object.email_attributes.email_id = line.replace('Message-ID: ', '').replace('>', '').replace('<', '');
    }
    if (line.includes('<!DOCTYPE html>')) {
      size = 1;
    }
    if (line.includes('</html>')) {
      size = 0;
      body.push(line);
    }
    if (size === 1) {
      body.push(line);
    }
  });
  body = body.toString().replace(',', '\n');
  json.object.email_attributes.body = body;
  cld.detect(body, (err, result) => {
    language = result.languages[0].name;
    json.object.email_attributes.email_language = language.toLowerCase();
  });
}


function treatSubject(lines) {
  const BreakException = {};
  try {
    lines.forEach((line) => {
      if (line.startsWith('Subject: ')) {
        json.object.email_attributes.subject.type = line.replace('Subject: ', '');
        json.object.email_attributes.subject.format = 'text';
        json.object.email_attributes.subject.characters = line.replace('Subject: ', '').length;
        cld.detect(line, (err, result) => {
          const language = result.languages[0].name;
          json.object.email_attributes.subject.language = language.toLowerCase();
        });
        if (Number.isNaN(line.replace('Subject: ', ''))) {
          json.object.email_attributes.subject.format = 'number';
        } else {
          json.object.email_attributes.subject.format = 'text';
        }
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }
}


function treatRecipient(lines) {
  const BreakException = {};
  try {
    lines.forEach((line) => {
      if (line.startsWith('Delivered-To: ')) {
        const nbrRecipient = line.replace('Delivered-To: ', '').split(' ').length;
        json.object.email_attributes.recipient_data.recipient_number = nbrRecipient;
        if (nbrRecipient > 1) {
          json.object.email_attributes.recipient_data.items.recipient.type = 'organisation';
        } else {
          json.object.email_attributes.recipient_data.items.recipient.type = 'individual';
        }
        const emails = line.replace('Delivered-To: ', '').split(' ');
        json.object.email_attributes.recipient_data.items.recipient.address = emails;
        const names = [];
        emails.forEach((e) => {
          names.push(e.split('@')[0]);
        });
        json.object.email_attributes.recipient_data.items.recipient.name = names;
      }
      if (line.startsWith('To: ')) {
        json.object.email_attributes.recipient_data.items.recipient.recipient_category = 'To';
        throw BreakException;
      }
      if (line.startsWith('Cc: ')) {
        json.object.email_attributes.recipient_data.items.recipient.recipient_category = 'Cc';
        throw BreakException;
      }
      if (line.startsWith('Bcc: ')) {
        json.object.email_attributes.recipient_data.items.recipient.recipient_category = 'Bcc';
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }
  try {
    if (lines[3].includes('by')) {
      const ipLine = lines[3].split(' ');
      json.object.email_attributes.recipient_data.items.recipient.ip = ipLine[ipLine.length - 1].replace('[', '').replace(']', '').replace(')', '').replace('(', '');
      throw BreakException;
    }
  } catch (e) {
    if (e !== BreakException) throw e;
  }
}


function treatSender(lines) {
  const BreakException = {};
  try {
    lines.forEach((line) => {
      if (line.includes('From: ')) {
        const sender = line.replace('From: ', '').replace(/'/g, ' ').split('<');
        sender.forEach((s) => {
          if (s.includes('@')) {
            json.object.email_attributes.sender.address = s.replace('>', '').replace('"', '');
            sender.pop(s);
            json.object.email_attributes.sender.name = sender[0].replace(/"/g, '');
          }
        });
      }
      if (line.includes('Received: from ')) {
        const ipLine = line.split(' ');
        const ip = ipLine[ipLine.length - 1].replace('[', '').replace(']', '').replace(')', '');
        json.object.email_attributes.sender.ip = ip;
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }
}

function detectLink(lines) {
  const urls = [];

  lines.forEach((line) => {
    if (line.includes('http://')) {
      const l = line.split('"').join(' ').split(' ');
      l.forEach((u) => {
        let url = u;
        if (url.includes('http://')) {
          if (url.startsWith('http://') && url.endsWith('/')) {
            urls.push(url);
          } else {
            while (!url.startsWith('http://')) {
              url = url.substr(1);
            }
            if (url.endsWith('>')) {
              url = url.slice(0, -1);
            }
            urls.push(url);
          }
        }
      });
    }
  });

  json.object.link.type = urls;
  json.object.link.link_number = urls.length;
  urls.forEach((url) => {
    if (url.includes('@')) {
      if (json.object.link.link_at) {
        json.object.link.link_at += 1;
      } else {
        json.object.link.link_at = 1;
      }
    }
  });
}


function emailFormat(lines) {
  const BreakException = {};
  try {
    lines.forEach((line) => {
      if (line.includes('Content-Type: multipart/alternative')) {
        json.object.email_attributes.email_format = 'mixed';
        throw BreakException;
      } else if (line.includes('Content-Type: text/plain')) {
        json.object.email_attributes.email_format = 'plain-text';
        throw BreakException;
      } else if (line.includes('Content-Type: text/html')) {
        json.object.email_attributes.email_format = 'HTML';
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }
}

function createdAt(lines) {
  const BreakException = {};
  try {
    lines.forEach((line) => {
      if (line.startsWith('Received: ') && line.endsWith('0000')) {
        const sep = line.split(';');
        const dateToStr = Date.parse(`${sep[1].replace('-0000', '')} GMT`);
        json.object.email_attributes.created = new Date(dateToStr);
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }
}

const getJSON = (req, res) => {
  res.json(req.file);
};

function convertToJSON(req, res, next, file) {
  new Promise((resolve, reject) => {
    fs.readFile(`Email_Analysis/Email/${file}.txt`, 'utf8', (err, data) => {
      if (err) {
        return reject(res.sendStatus(404));
      }
      json = {
        type: 'schema',
        id: 'schema--id',
        name: 'emailschema',
        description: 'A general schema for describing an email',
        created: new Date(),
        modified: new Date(),
        version: 1,
        object: {
          object_type: 'email',
          email_attributes: {
            subject: {
            },
            recipient_data: {
              items: {
                recipient: {
                },
              },
            },
            sender: {
            },
          },
          link: {},
        },
        required: ['sender', 'recipient', 'created', 'body', 'subject', 'email_language'],
      };
      email = data.split('\n');
      json.object.email_attributes.email_size = unescape(encodeURIComponent(data)).length;
      emailFormat(email);
      treatRecipient(email);
      treatSender(email);
      treatSubject(email);
      detectBody(email);
      detectLink(email);
      createdAt(email);
      return resolve();
    });
  }).then(() => {
    req.file = json;
    next();
  });
}

router.route('/:file')
  .get(getJSON);

router.param('file', convertToJSON);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', router);

app.listen(8080);
module.exports = app;
