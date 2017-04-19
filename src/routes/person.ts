'use strict';

import * as express from 'express';
import { IConnection } from 'mysql';

import * as moment from 'moment';
import * as path from 'path';

import { Connection } from '../models/connection';
import { ChronicModel } from '../models/chronic';
import { PersonModel } from '../models/person';

const json2xls = require('json2xls');
const fse = require('fs-extra');

const connection = new Connection();
const personModel = new PersonModel();

const router = express.Router();

let _conn: IConnection;

router.post('/duplicated',(req,res,next) => {
  const hospcode = req.body.hospcode;

  if (hospcode) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return personModel.getDuplicated(_conn, hospcode);
      })
      .then((result: any) => {
        _conn.destroy();
        res.send({ ok: true, rows: result });
      })
      .catch(error => {
        _conn.destroy();
        res.send({ ok: false, message: error });
      });
  } else { 
    res.send({ok: false, message: 'ข้อมูลไม่สมบูรณ์'})
  }
});


router.get('/duplicated/excel', (req, res, next) => {
  const hospcode = req.query.hospcode;

  if (hospcode) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return personModel.getDuplicated(_conn, hospcode);
      })
      .then((result: any) => {
        _conn.destroy();
        //res.send({ ok: true, rows: result });
        let xcel = json2xls(result);
        let tmpDir = process.env.TMP_FOLDER;
        fse.ensureDirSync(tmpDir);
        let _f = `duplicated-${hospcode}-${moment().format('x')}.xls`;
        let fileName = path.join(tmpDir, _f);
        fse.writeFileSync(fileName, xcel, 'binary');
        res.download(fileName, (err) => {
          if (err) {
            res.send({ ok: false, message: err })
          } else {
            fse.removeSync(fileName);
          }
        });
      })
      .catch(error => {
        _conn.destroy();
        res.send({ ok: false, message: error });
      });
  } else {
    res.send({ ok: false, message: 'ข้อมูลไม่สมบูรณ์' })
  }

});

export default router;
