/**
 * File: ReportToJSON.js
 * File Created: Wednesday, 1st August 2018 10:26:31 am
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Thursday, 11th October 2018 2:05:22 pm
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
const json = {
  Report: {
    Summary: '', 'Scan started': '', 'Scan ended': '', Task: '', 'Host Summary': {}, 'Host Authentifications': {}, 'Results for Host': {},
  },
};

function Summary(report) {
  let inside = 0;
  let summary = [];
  new Promise((resolve, reject) => {
    if (!report) {
      return reject(console.log('empty file !'));
    }
    report.some((line) => {
      if (line.startsWith('<h1>Summary</h1>')) {
        inside = 1;
      } if (line.startsWith('<table>')) {
        inside = 0;
        return resolve();
      }
      if (inside === 1) {
        summary.push(line);
      }
    });
    summary.shift();
    summary = summary.toString().replace(',', '');
    summary = summary.replace(/<p>/g, '').replace(/<\/p>/g, '\n').replace(/\s+/g, ' ');
    json.Report.Summary = summary;
    return resolve();
  });
}

function scanDate(report) {
  let status;
  report.some((line) => {
    if (status === 'start') {
      json.Report['Scan started'] = line.replace('<td><b>', '').replace('</b></td>', '');
      status = '';
    }
    if (status === 'end') {
      json.Report['Scan ended'] = line.replace('<td>', '').replace('</td>', '');
      status = '';
    }
    if (status === 'task') {
      json.Report.Task = line.replace('<td>', '').replace('</td>', '');
      status = '';
    }
    if (line.startsWith('<td>Scan started:</td>')) {
      status = 'start';
    }
    if (line.startsWith('<td>Scan ended:</td>')) {
      status = 'end';
    }
    if (line.startsWith('<td>Task:</td>')) {
      status = 'task';
    }
  });
}

function hostSummary(report) {
  const hs = [];
  let status;
  new Promise((resolve, reject) => {
    report.some((line) => {
      if (status === 'in') {
        hs.push(line);
      }
      if (line.startsWith('<h2>Host Summary</h2>')) {
        status = 'begin';
      }
      if (line.startsWith('<tr>') && status === 'begin') {
        status = 'in';
      }
      if (line.startsWith('</tr>') && status === 'in') {
        status = 'end';
        return resolve();
      }
    });
  });
  hs[0] = hs[0].replace('<td><a href="#', '').replace('</a></td>', '');
  hs[0] = hs[0].substring(hs[0].indexOf('">') + 2, hs[0].length);
  json.Report['Host Summary'].Host = hs[0];
  json.Report['Host Summary'].Start = hs[1].replace('<td>', '').replace('</td>', '');
  json.Report['Host Summary'].end = hs[2].replace('<td>', '').replace('</td>', '');
  json.Report['Host Summary'].High = hs[3].replace('<td>', '').replace('</td>', '');
  json.Report['Host Summary'].Medium = hs[4].replace('<td>', '').replace('</td>', '');
  json.Report['Host Summary'].Low = hs[5].replace('<td>', '').replace('</td>', '');
  json.Report['Host Summary'].Log = hs[6].replace('<td>', '').replace('</td>', '');
  json.Report['Host Summary']['False Positive'] = hs[7].replace('<td>', '').replace('</td>', '');
}

function hostAuth(report) {
  const ha = [];
  let status;
  new Promise((resolve, reject) => {
    report.some((line) => {
      if (status === 'in') {
        ha.push(line);
      }
      if (line.startsWith('<h2>Host Authentications</h2>')) {
        status = 'begin';
      } else if (line.startsWith('<tr>') && status === 'begin') {
        status = 'in';
      } else if (line.startsWith('</tr>') && status === 'in') {
        status = 'end';
        return resolve();
      }
    });
  });
  if (ha.length > 0 && status === 'end') {
    json.Report['Host Authentifications'].Host = ha[0].replace('<td>', '').replace('</td>', '');
    json.Report['Host Authentifications'].Protocole = ha[1].replace('<td>', '').replace('</td>', '');
    json.Report['Host Authentifications'].Resulte = ha[2].replace('<td>', '').replace('</td>', '');
    json.Report['Host Authentifications']['Port User'] = ha[3].replace('<td>', '').replace('</td>', '');
  }
}

function resultPerHost(report) {
  json.Report['Results for Host'].Host = json.Report['Host Authentifications'].Host;
  json.Report['Results for Host'].Scanning_Started_at = json.Report['Scan started'];
  const result = [];
  let status;
  new Promise((resolve, reject) => {
    report.some((line) => {
      if (status === 'in') {
        result.push(line);
      }
      if (line.startsWith('<h1>Results per Host</h1>')) {
        status = 'begin';
      }
      if (line.startsWith('<td>Number of results:</td>') && status === 'begin') {
        status = 'in';
      }
      if (line.startsWith('<h3>Security Issues for Host 192.12.193.86</h3>') && status === 'in') {
        status = 'end';
        return resolve();
      }
    });
  });
  const nbr = Number(result[0].replace('<td>', '').replace('</td>', ''));
  json.Report['Results for Host'].Number_of_results = nbr;
  let i = 0;
  while (nbr > i) {
    i += 1;
    json.Report['Results for Host'][`Port Summary #${i}`] = {};
    json.Report['Results for Host'][`Port Summary #${i}`]['Service Port'] = result[10 + ((i - 1) * 4)].replace('<td>', '').replace('</td>', '');
    json.Report['Results for Host'][`Port Summary #${i}`]['Threat Level'] = result[11 + ((i - 1) * 4)].replace('<td>', '').replace('</td>', '');
  }
}

function detectValue(res, key, j) {
  let status;
  const sol = [];
  for (let k = 15 + j; k < res.length; k += 1) {
    if (res[k].startsWith(`<b>${key}</b>`) && status !== 'end') {
      status = 'in';
    }
    if (res[k].startsWith('</div>') && status === 'in') {
      status = 'end';
    }
    if (status === 'in') {
      sol.push(res[k]);
    }
  }
  return sol.toString().replace(`<b>${key}</b><p>`, '').replace('</b>', '').replace(/<p>/g, ' ')
    .replace(/<\/p>/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');
}

function securityIssues(report) {
  const nbr = json.Report['Results for Host'].Number_of_results;
  let i = 0;
  const result = [];
  let status;
  new Promise((resolve, reject) => {
    report.some((line) => {
      if (status === 'in') {
        result.push(line);
      }
      if (line.startsWith('<h3>Security Issues for Host')) {
        status = 'in';
      }
      if (line.startsWith('</tr></table></p>') && status === 'in') {
        status = 'end';
        return resolve();
      }
    });
  });
  while (nbr > i) {
    i += 1;
    json.Report['Results for Host'][`Security Issues ${i}`] = {};
    let res;
    if (i < nbr) {
      res = result.splice(0, result.indexOf('</table></p>'));
      if (res.length === 0) {
        res = result.splice(0, result.indexOf('</table></p>\r'));
      }
    } else {
      res = result;
    }
    while (!res[0].startsWith('<div class="result')) {
      res.shift();
    }
    json.Report['Results for Host'][`Security Issues ${i}`]['Threat Level'] = `${res[2].replace('<b>', '').replace('</b>', '')} ${res[3].replace(/\s+/g, ' ')}`;
    json.Report['Results for Host'][`Security Issues ${i}`].NVT = `${res[6].replace(/\s+/g, ' ')} ${res[7].replace(/\s+/g, ' ')}`;
    json.Report['Results for Host'][`Security Issues ${i}`].Summary = `${res[11].replace('<b>Summary</b><p>', '').replace('</b>', '')} ${res[12].replace('</p>', ' ').replace(/\s+/g, ' ')}`;
    let j = 0;
    const vul = [];
    while ((res[15 + j] !== '</div>' && res[15 + j] !== '</div>\r') && 15 + j <= res.length) {
      vul.push(res[15 + j]);
      j += 1;
    }
    json.Report['Results for Host'][`Security Issues ${i}`].Vulnerability = vul.toString().replace('<b>Vulnerability Detection Result</b><pre>', '').replace('</pre>', '');
    const imp = detectValue(res, 'Impact', j);
    json.Report['Results for Host'][`Security Issues ${i}`].Impact = imp;
    // let sta;
    const sol = detectValue(res, 'Solution', j);
    json.Report['Results for Host'][`Security Issues ${i}`].Solution = sol;
    const aff = detectValue(res, 'Affected Software/OS', j);
    json.Report['Results for Host'][`Security Issues ${i}`]['Affected Software/OS'] = aff;
    const vi = detectValue(res, 'Vulnerability Insight', j);
    if (vi !== '') {
      json.Report['Results for Host'][`Security Issues ${i}`]['Vulnerability Insight'] = vi;
    }
    const vdm = detectValue(res, 'Vulnerability Detection Method', j);
    json.Report['Results for Host'][`Security Issues ${i}`]['Vulnerability Detection Method'] = vdm;
    const ref = detectValue(res, 'References', j);
    json.Report['Results for Host'][`Security Issues ${i}`].References = ref.replace('<b>References<br> <table>', '').replace(/<td>/g, '').replace(/<\/td>/g, '').replace(/<tr>/g, '')
      .replace(/<\/tr>/g, '')
      .replace(/<tr valign=\"top\">/g, '')
      .replace('</table>', '');
  }
}


function toJSON(report) {
  Summary(report);
  scanDate(report);
  hostSummary(report);
  hostAuth(report);
  resultPerHost(report);
  securityIssues(report);
}

const post = function convertToJSON(req, res) {
  new Promise((resolve, reject) => {
    const { path } = req.file;
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        return reject(res.sendStatus(404));
      }
      const report = data.split('\n');
      toJSON(report);
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
router.route('/reportToStixJSON')
  .post(upload.single('report'), post);

router.use('/format-adapter/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/format-adapter/api/v1', router);

module.exports = router;

