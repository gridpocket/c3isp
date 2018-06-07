/*
* @Author: paps
*
* GridPocket SAS Copyright (C) 2016 All Rights Reserved
* This source is property of GridPocket SAS. Please email contact@gridpocket.com for more
* information.
*
* @File name:  csvToCef.js
* @Date:   2018-04-25
* @Last Modified by:   paps
* @Last Modified time: 2018-06-07
*
* @Description: This script enables to convert log files from CSV format to CEF format
*/

const fs = require('fs');
const express = require('express');
const LineByLineReader = require('line-by-line');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const multer = require('multer');
const crypto = require('crypto');


const upload = multer({ dest: 'uploads/' });

// const app = express();
const router = express.Router();

/* Process file name of the input to get initial content of the converted file
Input template => Router_Vendor_Router_CED_1.0_100_ConnectionDetected_5_.txt
Output template => CEF:0|Router_Vendor|Router_CED|1.0|100|ConnectionDetected|5|
*/
function produceInitialContentOfCefFile(fileName) {
  let initialContentOfCefFile = fileName.split('_');
  initialContentOfCefFile = `CEF:0|${initialContentOfCefFile[0]}_${initialContentOfCefFile[1]}|${initialContentOfCefFile[2]}_${initialContentOfCefFile[3]}|${initialContentOfCefFile[4]}|${initialContentOfCefFile[5]}|${initialContentOfCefFile[6]}|${initialContentOfCefFile[7]}|`;
  return initialContentOfCefFile;
}

/* Conversion of Connection detection inputs (fileNameConnectionDetected with indexOf Router)
Input template => 2017-09-15 09:56:00.000 0.000 UDP 192.168.1.2:24920 -> 2.4.55.66:22126 1 46 1
Output template => CEF:0|Router_Vendor|Router_CED|1.0|100|ConnectionDetected|5|src=192.168.1.2
spt=24920dst=2.4.55.66 dpt=22126 proto=UDP end=1505433600000

Conversion of Domain generation Algorithm inputs (fileNameDomainGeneration with indexOf DNS)
Input template => 15-Sep-2017 16:11:43.431 client 192.168.1.2#37239 (www.google.com):
query: www.google.com IN A -EDC (192.168.1.9)
Output template => CEF:0|DNS_Vendor|DNS_CED|1.0|100|DNSquery|5|src=192.168.1.2 spt=37239
msg=IN A -EDC (192.168.1.9) end=1505484703431
*/
function processFiles(fileName, originalName, cb) {
  const lr = new LineByLineReader(fileName);
  const part1 = produceInitialContentOfCefFile(originalName);

  fs.unlink(`${fileName}.cef`, (err) => {
    // if (err) console.log('No deletion needed as ', `${fileName}.cef`, ' doesn\'t exist.');
    if (err) ;

    if (originalName.indexOf('DNS') !== -1) {
      lr.on('line', (l) => {
        const line = l.split(' ');
        let newLine = part1;
        newLine += `src=${line[3].split('#')[0]}`;
        newLine += ` spt=${line[3].split('#')[1]}`;
        newLine += ` msg=${line[7]}`;
        // Need to copy from 'IN A -EDC (192.168.1.9)' with IN at the index 8
        for (let i = 8; i < line.length; i += 1) {
          newLine += `${line[i]}`;
        }
        newLine += ` end=${new Date(`${line[0]}, ${line[1]}`).getTime()}`;
        newLine += ' dtz=Europe/Berlin \n';

        fs.appendFile(`${originalName}.cef`, newLine, (error) => {
          if (error) throw error;
        });
      });
    } else if (originalName.indexOf('Router') !== -1) {
      let index = 0;
      lr.on('line', (l) => {
        index = index + 1;
        const line = l.split(' ');
        let newLine = part1;
        newLine += `src=${line[4].split(':')[0]}`;
        newLine += ` spt=${line[4].split(':')[1]}`;
        newLine += ` dst=${line[6].split(':')[0]}`;
        newLine += ` dpt=${line[6].split(':')[1]}`;
        newLine += ` proto=${line[3]}`;
        newLine += ` end=${new Date(line[0]).getTime()}`;
        newLine += ' dtz=Europe/Berlin \n';
        
        if(index > 1){
          fs.appendFile(`${originalName}.cef`, newLine, (error) => {
            if (error) throw error;
          });
        }
      });
    }

    lr.on('end', () => {
      cb(`${originalName}.cef`);
    });
  });
}

const post = function convertToJSON(req, res, next) {
  let contentToDisplay;
  let stix;
  // const { path } = req.file;
  new Promise((resolve, reject) => {
    if (req.originalUrl !== '/favicon.ico') {
      processFiles(req.file.path, req.file.originalname, (path) => {
        fs.readFile(path, 'utf8', (err, data) => {
          if (err) {
            return reject(res.sendStatus(404));
          }
          contentToDisplay = data;

          return resolve();
        });
        fs.unlink(path, (err) => {
          if(err) return err;
        });
      });
    }
  }).then(() => {
    stix = {
      spec_version: '2.0',
      type: 'stix-bundle',
      id: 'stix-bundle--hash',
      objects: [
        {
          type: 'observed-data',
          id: `observed-data--${crypto.createHmac('sha1', JSON.stringify(contentToDisplay)).digest('hex')}`,
          created: new Date(),
          modified: new Date(),
          first_observed: new Date(),
          last_observed: new Date(),
          cybox: {
            spec_version: '3.0',
            objects: [
              {
                type: 'array',
                minitems: '1',
                items: [contentToDisplay],
              },
            ],
          },
        },
      ],
    };
  }).then(() => {
    stix.id = `stix-bundle--${crypto.createHmac('sha1', JSON.stringify(stix)).digest('hex')}`;
    res.send(stix);
    next();
  });
};

router.route('/csv/')
  .post(upload.single('csvfile'), post);


router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/api/v1', router);

module.exports = router;
