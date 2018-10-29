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
const os = require('os');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();


const post = function removeStix(req, res) {
  /* if (req.headers.user !== 'user' || req.headers.password !== 'password') {
    return res.status(403).json({ error: 'Username or/and password incorrect' });
  } */
  const { path } = req.file;
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      fs.unlinkSync(path);
      return res.sendStatus(404);
    }
    if (!data.startsWith('{')) {
      fs.unlinkSync(path);
      return res.sendStatus(400);
    }
    const json = JSON.parse(data);
    let objects = json.objects[0].cybox.objects[0].items[0];
    if (Array.isArray(objects)) {
      objects = objects.join(os.EOL);
    }
    fs.unlinkSync(path);
    res.setHeader('content-type', 'text/plain');
    return res.send(objects);
  });
};

router.route('/convertDL')
  .post(upload.single('file'), post);


router.use('/format-adapter/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/format-adapter/api/v1', router);

module.exports = router;
