/**
 * File: firewallToCEF.js
 * File Created: Friday, 3rd August 2018 9:57:58 am
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Friday, 21st September 2018 11:09:33 am
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * GridPocket SAS Copyright (C) 2018 All Rights Reserved
 * This source is property of GridPocket SAS.
 * Please email contact@gridpocket.com for more information.
 */


const fs = require('fs');
const express = require('express');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
let cef = [];

function toCEF(fe) {
  fe.shift();
  fe.pop();
  fe.forEach((line) => {
    let l = line.replace(/, /g, ' ');
    l = l.split('|');
    for (let i = 0; i < l.length; i += 1) {
      if (l[i] === '') {
        l[i] = '""';
      }
    }
    l[0] = ` rt = ${l[0]}`;
    l[1] = ` start = ${l[1]}`;
    l[2] = ` dvchost = ${l[2]}`;
    l[3] = ` reason = ${l[3]}`;
    l[4] = ` TRendMicroDsTags = ${l[4]}`;
    l[5] = ` act = ${l[5]}`;
    l[6] = ` cs1 = ${l[6]}`;
    l[7] = ` deviceDirecttion = ${l[7]}`;
    l[8] = ` deviceInboundInterface = ${l[8]}`;
    l[9] = ` TrendMicroDsFrameType = ${l[9]}`;
    l[10] = ` proto = ${l[10]}`;
    l[11] = ` cs2 = ${l[11]}`;
    l[12] = ` src = ${l[12]}`;
    l[13] = ` smac = ${l[13]}`;
    l[14] = ` spt = ${l[14]}`;
    l[15] = ` dst = ${l[15]}`;
    l[16] = ` dmac = ${l[16]}`;
    l[17] = ` dpt = ${l[17]}`;
    l[18] = ` out = ${l[18]}`;
    l[19] = ` cnt = ${l[19]}`;
    l[20] = ` end = ${l[20]}`;
    l[21] = ` cs3 = ${l[21]}`;
    l[22] = ` cs4 = ${l[22]}`;
    l[23] = ` msg = ${l[23]}`;
    l[24] = ` cs5 = ${l[24]}`;
    l[25] = ` cs6 = ${l[25]}`;
    l[26] = ` TrendMicroDsPacketData = ${l[26]}`;
    l[27] = ` cat = ${l[27]}`;

    l[0] = l[0].replace(/\"/g, '');
    l[20] = l[20].replace(/\"/g, '');
    l = l.toString().replace(/,/g, '');

    cef.push(`CEF:0|Trend Micro|Deep Security Manager|9.6|20|MSS Firewall Event|3|${l}`);
  });
}

const post = function convertToJSON(req, res) {
  new Promise((resolve, reject) => {
    const { path } = req.file;
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        return reject(res.sendStatus(404));
      }
      const fe = data.split('\n');
      toCEF(fe);
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
          id: `observed-data--${crypto.createHmac('sha1', JSON.stringify(cef)).digest('hex')}`,
          created: new Date(),
          modified: new Date(),
          first_observed: new Date(),
          last_observed: new Date(),
          cybox: {
            spec_version: '3.0',
            objects: [
              {
                items: [cef],
              },
            ],
          },
        },
      ],
    };
    cef = [];
    json2.id = `stix-bundle--${crypto.createHmac('sha1', JSON.stringify(json2)).digest('hex')}`;
    const finalJSON = json2;
    res.json(finalJSON);
  })
    .catch((err) => {
      console.error('Error during process', err);
      res.status(500).send(err);
    });
};
router.route('/firewallToStixCEF')
  .post(upload.single('firewall'), post);

router.use('/format-adapter/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/format-adapter/api/v1', router);

module.exports = router;

