/*
 * File: EmailToJSON.js
 * File Created: Thursday, 3rd May 2018 5:08:32 pm
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Wednesday, 23rd May 2018 11:45:41 am
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Copyright 2018 GridPocket, GridPocket
 */

const fs = require('fs');
const cld = require('cld');
const express = require('express');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
let email;
let json;

function detectBody(lines) {
  let body = [];
  let size = 0;
  let language;
  new Promise((resolve, reject) => {
    if (!lines) {
      return reject(console.log('empty file !'));
    }
    lines.forEach((line) => {
      if (line.includes('Message-ID: ')) {
        json.object.email_attributes.email_id = line.replace('Message-ID: ', '').replace('>', '').replace('<', '');
      }
      if (line.includes('<!DOCTYPE html>') || line.includes('<html>')) {
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
    return resolve();
  }).then(() => {
    cld.detect(body, (err, result) => {
      language = result.languages[0].name;
      json.object.email_attributes.email_language = language.toLowerCase();
    });
  });
}

function attachment(lines) {
  const safe = ['.au', '.avi', '.bmp', '.cdr', '.drw', '.dwg', '.dxf', '.eps', '.gif', '.ico', '.img', '.jpeg', '.jpg', '.log', '.mdb', '.mde', '.mid', '.midi', '.mov', '.movie', '.mp1', '.mp2', '.mp3', '.mpeg', '.mpg', '.msg', '.nws', '.obd', '.pcx', '.pdd', '.pdf', '.pic', '.pps', '.pub', '.qbb', '.qbw', '.qdb', '.ra', '.snd', '.text', '.tga', '.tif', '.tsv', '.txt', '.wav', '.wma', '.wmf', '.wri'];
  const caution = ['.alx', '.asp', '.cab', '.cda', '.chf', '.cur', '.dic', '.doc', '.dot', '.fav', '.grp', '.gtar', '.gwf', '.gz', '.hlp', '.ht', '.htm', '.html', '.inf', '.ini', '.iso', '.ldb', '.lnk', '.mdw', '.msi', '.msp', '.oft', '.pbk', '.pcl', '.pot', '.ppt', '.shtml', '.sys', '.tar', '.tgz', '.ttf', '.url', '.uu', '.vir', '.wb2', '.wbk', '.wiz', '.wk4', '.wks', '.wpd', '.xlk', '.xls', '.xlt', '.xml', '.z', '.zip'];
  const dangerous = ['.bas', '.bat', '.bin', '.c', '.cmd', '.com', '.cpl', '.dll', '.eml', '.exe', '.java', '.js', '.jse', '.pif', '.pl', '.reg', '.scr', '.sct', '.vbe', '.vbs', '.wsc', '.wsf', '.wsh'];
  lines.forEach((line) => {
    if (line.startsWith('Content-Disposition: attachment;')) {
      const l = line.split('.');
      const extension = `.${l[l.length - 1].replace('"', '').replace('\r', '')}`;
      json.object.email_attributes.attachment.attachment_format = extension;
      safe.forEach((e) => {
        if (e === extension) {
          json.object.email_attributes.attachment.safety_rating = 'safe';
        }
      });
      caution.forEach((e) => {
        if (e === extension) {
          json.object.email_attributes.attachment.safety_rating = 'caution';
        }
      });
      dangerous.forEach((e) => {
        if (e === extension) {
          json.object.email_attributes.attachment.safety_rating = 'dangerous';
        }
      });
    }
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

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function treatRecipient(lines) {
  const BreakException = {};
  try {
    lines.forEach((line) => {
      if (line.startsWith('To: ')) {
        const mails = line.replace('To: ', '').split(' ');
        const emails = [];
        mails.forEach((e) => {
          if (e.includes('>')) {
            emails.push(e.replace('>', '').replace('<', ''));
          }
        });
        if (emails.length < 1) {
          mails.forEach((e) => {
            if (e.includes('@')) {
              emails.push(e);
            }
          });
        }
        json.object.email_attributes.recipient_data.items.recipient.address = emails;
        const nbrRecipient = emails.length;
        json.object.email_attributes.recipient_data.recipient_number = nbrRecipient;
        if (nbrRecipient > 1) {
          json.object.email_attributes.recipient_data.items.recipient.type = 'organisation';
        } else {
          json.object.email_attributes.recipient_data.items.recipient.type = 'individual';
        }
        const names = [];
        mails.forEach((e) => {
          if (!e.includes('@')) {
            names.push(e);
          }
        });
        if (names.length < 1) {
          mails.forEach((e) => {
            names.push(e.split('@')[0].replace('<', ''));
          });
        }
        const uniqueName = names.filter(onlyUnique);
        json.object.email_attributes.recipient_data.items.recipient.name = uniqueName;
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
    const BreakException = {};
    try {
      if (line.includes('Received: from ')) {
        const ipLine = line.split(' ');
        const ip = ipLine[ipLine.length - 1].replace('[', '').replace(']', '').replace(')', '');
        if (!Number.isNaN(Number(ip[ip.length - 1]))) {
          json.object.email_attributes.sender.ip = ip;
        }
        throw BreakException;
      }
    } catch (e) {
      if (e !== BreakException) throw e;
    }
  });
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
            let i = 0;
            url.split('/')[2].split('.').forEach((e) => {
              if (!Number.isNaN(Number(e))) {
                i += 1;
              }
            });
            if (i === 4) {
              if (json.object.link.link_ip) {
                json.object.link.link_ip += 1;
              } else {
                json.object.link.link_ip = 1;
              }
            }
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
      if (line.startsWith('Received: ') && line.endsWith('0')) {
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


const post = function convertToJSON(req, res) {
  new Promise((resolve, reject) => {
    const { path } = req.file;
    fs.readFile(path, 'utf8', (err, data) => {
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
            attachment: {
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
      attachment(email);
      json.id = `schema--${crypto.createHmac('sha1', JSON.stringify(json)).digest('hex')}`;
      fs.unlinkSync(path);
      return resolve();
    });
  }).then(() => {
    const json2 = {
      spec_version: '2.0',
      type: 'stix-bundle',
      id: 'stix-bundle--hash',
      objects: [
        {
          type: 'observed-data',
          id: `observed-data--${crypto.createHmac('sha1', JSON.stringify(json)).digest('hex')}`,
          created: new Date(),
          modified: new Date(),
          first_observed: new Date(),
          last_observed: new Date(),
          cybox: {
            spec_version: '3.0',
            objects: [
              {
                type: 'email',
                minitems: '1',
                items: [json],
              },
            ],
          },
        },
      ],
    };
    json2.id = `stix-bundle--${crypto.createHmac('sha1', JSON.stringify(json2)).digest('hex')}`;
    const finalJSON = json2;
    res.json(finalJSON);
  })
    .catch((err) => {
      console.error('Error during process', err);
      res.status(500).send(err);
    });
};

router.route('/email')
  .post(upload.single('emailfile'), post);


router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/api/v1', router);

module.exports = router;
