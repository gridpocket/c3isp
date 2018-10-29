/**
 * File: detect.js
 * File Created: Tuesday, 10th July 2018 10:46:07 am
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Wednesday, 17th October 2018 4:48:32 pm
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * GridPocket SAS Copyright (C) 2018 All Rights Reserved
 * This source is property of GridPocket SAS.
 * Please email contact@gridpocket.com for more information.
 */

const fs = require('fs');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const multer = require('multer');
const request = require('request');
const config = require('../config');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();


const post = function convert(res, req) {
  new Promise((resolve, reject) => {
    const { path } = res.file;
    fs.readFile(path, 'utf8', (err, file) => {
      if (err) {
        console.log(err);
        fs.unlinkSync(path);
        return reject(req.sendStatus(404));
      } else if (file.startsWith('{')) {
        const json = JSON.parse(file);
        fs.unlinkSync(path);
        req.json(json);
        return resolve();
      } else if (res.file.originalname.endsWith('.html')) {
        const options = {
          method: 'POST',
          url: `${config.scheme}://${config.hostname}:${config.port}/format-adapter/api/v1/reportToStixJSON`,
          formData: {
            report: fs.createReadStream(path),
          },
          json: true,
        };
        request(options, (error, response, body) => {
          if (error) throw new Error(error);
          fs.unlinkSync(path);
          req.json(body);
          return resolve();
        });
      } else if (res.file.originalname.endsWith('Firewall Event_3_.txt')) {
        const options = {
          method: 'POST',
          url: `${config.scheme}://${config.hostname}:${config.port}/format-adapter/api/v1/firewallToStixCEF`,
          formData: {
            firewall: fs.createReadStream(path),
          },
          json: true,
        };
        request(options, (error, response, body) => {
          if (error) throw new Error(error);
          fs.unlinkSync(path);
          req.json(body);
          return resolve();
        });
      } else if (res.file.originalname.endsWith('Anti-Malware Event_6.txt')) {
        const options = {
          method: 'POST',
          url: `${config.scheme}://${config.hostname}:${config.port}/format-adapter/api/v1/malwareToStixCEF`,
          formData: {
            malware: fs.createReadStream(path),
          },
          json: true,
        };
        request(options, (error, response, body) => {
          if (error) throw new Error(error);
          fs.unlinkSync(path);
          req.json(body);
          return resolve();
        });
      } else if (file.startsWith('category') || file.startsWith('timestamp')) {
        const options = {
          method: 'POST',
          url: `${config.scheme}://${config.hostname}:${config.port}/format-adapter/api/v1/dataModel`,
          formData: {
            data: fs.createReadStream(path),
          },
          json: true,
        };
        request(options, (error, response, body) => {
          if (error) throw new Error(error);
          fs.unlinkSync(path);
          req.json(body);
          return resolve();
        });
      } else if (file.startsWith('Return-Path:') || file.startsWith('Delivered-To:')) {
        const options = {
          method: 'POST',
          url: `${config.scheme}://${config.hostname}:${config.port}/format-adapter/api/v1/emailToStixJSON`,
          formData: {
            emailfile: fs.createReadStream(path),
          },
          json: true,
        };
        request(options, (error, response, body) => {
          if (error) throw new Error(error);
          fs.unlinkSync(path);
          req.json(body);
          return resolve();
        });
      } else if (file.startsWith('Date flow') || res.file.originalname.startsWith('DNS')) {
        const newPath = `uploads/${res.file.originalname}`;
        fs.renameSync(path, newPath);
        const options = {
          method: 'POST',
          url: `${config.scheme}://${config.hostname}:${config.port}/format-adapter/api/v1/csvToStixCEF`,
          formData: {
            csvfile: fs.createReadStream(newPath),
          },
        };
        request(options, (error, response, body) => {
          if (error) throw new Error(error);
          fs.unlinkSync(newPath);
          req.json(JSON.parse(body));
          return resolve();
        });
      } else {
        fs.unlinkSync(path);
        return req.sendStatus(400);
      }
      return resolve();
    });
  });
};

router.route('/convert')
  .post(upload.single('file'), post);

router.use('/format-adapter/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/format-adapter/api/v1', router);

module.exports = router;
