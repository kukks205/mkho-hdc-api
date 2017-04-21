'use strict';

import * as express from 'express';
import { IConnection } from 'mysql';

import * as moment from 'moment';
import * as path from 'path';

import { Connection } from '../models/connection';
import { AncModel } from '../models/anc';

const json2xls = require('json2xls');
const fse = require('fs-extra');

const connection = new Connection();
const ancModel = new AncModel();

const router = express.Router();

let _conn: IConnection;
/* GET home page. */
router.post('/history',(req,res,next) => {
  const cid = req.body.cid;
  const gravida = req.body.gravida;

  if (cid && gravida) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return ancModel.getAncHistory(_conn, cid, gravida);
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
    res.send({ok: false, message: 'กรุณาระบุเลขบัตรประชาชน'})
  }
});

router.post('/post/history',(req,res,next) => {
  const cid = req.body.cid;
  const gravida = req.body.gravida;

  if (cid && gravida) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return ancModel.getPostHistory(_conn, cid, gravida);
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
    res.send({ok: false, message: 'กรุณาระบุเลขบัตรประชาชน'})
  }
});



router.get('/excel-export', (req, res, next) => {
  const hospcode = req.query.hospcode;
  console.log(hospcode);
  
  if (hospcode) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return ancModel.getAncTarget(_conn, hospcode);
      })
      .then((result: any) => {
        _conn.destroy();
        //res.send({ ok: true, rows: result });
        let xcel = json2xls(result);
        let tmpDir = process.env.TMP_FOLDER;
        fse.ensureDirSync(tmpDir);
        let _f = `anc-${hospcode}-${moment().format('x')}.xls`;
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