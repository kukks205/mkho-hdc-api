'use strict';

import * as express from 'express';
import { IConnection } from 'mysql';

import { Connection } from '../models/connection';
import { AncModel } from '../models/anc';

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

export default router;