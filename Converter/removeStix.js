/*
 * File: removeStix.js
 * File Created: Thursday, 31st May 2018 11:29:55 am
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Thursday, 31st May 2018 11:58:20 am
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Copyright 2018 GridPocket, GridPocket
 */


const fs = require('fs');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();


const post = function removeStix(req, res) {
  const { path } = req.file;
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      return res.sendStatus(404);
    }
    const json = JSON.parse(data);
    const objects = json.objects[0].cybox.objects[0].items[0];
    return res.send(objects);
  });
};

router.route('/stix')
  .post(upload.single('stix'), post);


router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/api/v1', router);

module.exports = router;
