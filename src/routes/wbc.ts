'use strict';

import * as express from 'express';
import { IConnection } from 'mysql';

import { Connection } from '../models/connection';
import { WbcModel } from '../models/wbc';

const connection = new Connection();
const wbcModel = new WbcModel();

const router = express.Router();

let _conn: IConnection;
/* GET home page. */
router.post('/history',(req,res,next) => {
  const cid = req.body.cid;

  if (cid) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return wbcModel.history(_conn, cid);
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

router.post('/vaccine/history',(req,res,next) => {
  const cid = req.body.cid;

  if (cid) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return wbcModel.vaccineHistory(_conn, cid);
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

export default router;
