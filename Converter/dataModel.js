/**
 * File: dataModel.js
 * File Created: Monday, 6th August 2018 3:04:08 pm
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Wednesday, 19th September 2018 11:30:49 am
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
const cef = [];

function toCEF(fe) {
  const field = fe[0].replace(/\r/g, '').split(',');
  fe.shift();
  fe.pop();
  if (field.includes('src_ip') && field.includes('event_name') === false) {
    fe.forEach((line) => {
      let l = line.replace(/, /g, ' ');
      l = l.split(',');
      for (let i = 0; i < l.length; i += 1) {
        if (l[i] === '') {
          l[i] = '""';
        }
      }
      let li = [];
      li[0] = ` cat = ${l[field.indexOf('category')]}`;
      li[1] = ` rt = ${l[field.indexOf('timestamp')]}`;
      li[2] = ` act = ${l[field.indexOf('action')]}`;
      li[3] = ` src = ${l[field.indexOf('src_ip')]}`;
      li[4] = ` dst = ${l[field.indexOf('dest_ip')]}`;
      li[5] = ` spt = ${l[field.indexOf('src_port')]}`;
      li[6] = ` dpt = ${l[field.indexOf('dest_port')]}`;
      li[7] = ` dvc = ${l[field.indexOf('device_ip')]}`;
      li[8] = ` cs1 = ${l[field.indexOf('ids_type')]}`;
      li[9] = ` slat = ${l[field.indexOf('src_latitude')]}`;
      li[10] = ` slong = ${l[field.indexOf('src_longitude')]}`;

      li = li.toString().replace(/,/g, '').replace(/undefined/g, '""');

      cef.push(`CEF:0|${l[field.indexOf('vendor_name')]}|${l[field.indexOf('vendor_product')]}|${l[field.indexOf('product_version')]}|${l[field.indexOf('signature_id')].replace('\r', '')}|${l[field.indexOf('signature_name')]}|${l[field.indexOf('severity')]}|${li}`);
    });
  }
  if (field.includes('src_ip') === false && field.includes('event_name') === false) {
    fe.forEach((line) => {
      let l = line.replace(/, /g, ' ');
      l = l.split(',');
      for (let i = 0; i < l.length; i += 1) {
        if (l[i] === '') {
          l[i] = '""';
        }
      }
      let li = [];
      li[0] = ` cat = ${l[field.indexOf('category')]}`;
      li[1] = ` rt = ${l[field.indexOf('timestamp')]}`;
      li[2] = ` act = ${l[field.indexOf('action')]}`;
      li[3] = ` dst = ${l[field.indexOf('dest_ip')]}`;
      li[4] = ` dhost = ${l[field.indexOf('dest_host')]}`;
      li[5] = ` cs1 = ${l[field.indexOf('dest_category')]}`;
      li[6] = ` cs2 = ${l[field.indexOf('dest_os')]}`;
      li[7] = ` dntdom = ${l[field.indexOf('dest_nt_domain')]}`;
      li[8] = ` fname = ${l[field.indexOf('file_name')]}`;
      li[9] = ` filePath = ${l[field.indexOf('file_path')]}`;
      li[10] = ` fileHash = ${l[field.indexOf('file_hash')]}`;
      li[11] = ` cs3 = ${l[field.indexOf('signature_version')]}`;
      li[9] = ` dlat = ${l[field.indexOf('dest_latitude')]}`;
      li[10] = ` dlong = ${l[field.indexOf('dest_longitude')]}`;

      li = li.toString().replace(/,/g, '').replace(/undefined/g, '""');
      cef.push(`CEF:0|${l[field.indexOf('vendor_name')]}|${l[field.indexOf('vendor_product')]}|${l[field.indexOf('product_version')]}|${l[field.indexOf('signature_id')].replace('\r', '')}|${l[field.indexOf('signature_name')]}|${l[field.indexOf('severity')]}|${li}`);
    });
  } if (field.includes('transport_protocol')) { // 7.3
    fe.forEach((line) => {
      let l = line.replace(/, /g, ' ');
      l = l.split(',');
      for (let i = 0; i < l.length; i += 1) {
        if (l[i] === '') {
          l[i] = '""';
        }
      }
      let li = [];
      li[0] = ` rt = ${l[field.indexOf('timestamp')]}`;
      li[1] = ` act = ${l[field.indexOf('action')]}`;
      li[2] = ` src = ${l[field.indexOf('src_ip')]}`;
      li[3] = ` shost = ${l[field.indexOf('src_host')]}`;
      li[4] = ` spt = ${l[field.indexOf('src_port')]}`;
      li[5] = ` dst = ${l[field.indexOf('dest_ip')]}`;
      li[6] = ` dhost = ${l[field.indexOf('dest_host')]}`;
      li[7] = ` dpt = ${l[field.indexOf('dest_port')]}`;
      li[8] = ` app = ${l[field.indexOf('app_protocol')]}`;
      li[9] = ` proto = ${l[field.indexOf('transport_protocol')]}`;
      li[10] = ` dvc = ${l[field.indexOf('device_ip')]}`;
      li[11] = ` deviceDirection = ${l[field.indexOf('direction')]}`;
      li[12] = ` slat = ${l[field.indexOf('src_latitude')]}`;
      li[13] = ` slong = ${l[field.indexOf('src_longitude')]}`;
      li[14] = ` dlat = ${l[field.indexOf('dest_latitude')]}`;
      li[15] = ` dlong = ${l[field.indexOf('dest_longitude')]}`;
      li = li.toString().replace(/,/g, '').replace(/undefined/g, '""');

      cef.push(`CEF:0|${l[field.indexOf('vendor_name')]}|${l[field.indexOf('vendor_product')]}|${l[field.indexOf('product_version')]}|${l[field.indexOf('event_id')].replace('\r', '')}|${l[field.indexOf('event_name')]}|${l[field.indexOf('severity')]}|${li}`);
    });
  } if (field.includes('http_method')) { // 7.4
    fe.forEach((line) => {
      let l = line.replace(/, /g, ' ');
      l = l.split(',');
      for (let i = 0; i < l.length; i += 1) {
        if (l[i] === '') {
          l[i] = '""';
        }
      }
      let li = [];
      li[0] = ` cat = ${l[field.indexOf('category')]}`;
      li[0] = ` rt = ${l[field.indexOf('timestamp')]}`;
      li[1] = ` act = ${l[field.indexOf('action')]}`;
      li[2] = ` src = ${l[field.indexOf('src_ip')]}`;
      li[5] = ` dst = ${l[field.indexOf('dest_ip')]}`;
      li[7] = ` dpt = ${l[field.indexOf('dest_port')]}`;
      li[14] = ` dlat = ${l[field.indexOf('dest_latitude')]}`;
      li[15] = ` dlong = ${l[field.indexOf('dest_longitude')]}`;
      li[8] = ` in = ${l[field.indexOf('bytes_in')]}`;
      li[9] = ` out = ${l[field.indexOf('bytes_out')]}`;
      li[11] = ` cn1 = ${l[field.indexOf('duration')]}`;
      li[5] = ` cs1 = ${l[field.indexOf('http_content_type')]}`;
      li[5] = ` requestMethod= ${l[field.indexOf('http_method')]}`;
      li[5] = ` requestContext= ${l[field.indexOf('http_referrer')]}`;
      li[5] = ` requestClientApplication= ${l[field.indexOf('http_user_agent')]}`;
      li[12] = ` cs2 = ${l[field.indexOf('status')]}`;
      li[13] = ` request = ${l[field.indexOf('url')]}`;
      li[10] = ` dvc = ${l[field.indexOf('device_ip')]}`;

      li = li.toString().replace(/,/g, '').replace(/undefined/g, '""');

      cef.push(`CEF:0|${l[field.indexOf('vendor_name')]}|${l[field.indexOf('vendor_product')]}|${l[field.indexOf('product_version')]}|${l[field.indexOf('event_id')].replace('\r', '')}|${l[field.indexOf('event_name')]}|${l[field.indexOf('severity')]}|${li}`);
    });
  }
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
    json2.id = `stix-bundle--${crypto.createHmac('sha1', JSON.stringify(json2)).digest('hex')}`;
    const finalJSON = json2;
    res.json(finalJSON);
  })
    .catch((err) => {
      console.error('Error during process', err);
      res.status(500).send(err);
    });
};
router.route('/dataModel')
  .post(upload.single('data'), post);

router.use('/format-adapter/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/format-adapter/api/v1', router);

module.exports = router;

