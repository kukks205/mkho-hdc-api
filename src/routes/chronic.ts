'use strict';

import * as express from 'express';
import { IConnection } from 'mysql';

import { Connection } from '../models/connection';
import { ChronicModel } from '../models/chronic';

const connection = new Connection();
const chronicModel = new ChronicModel();

const router = express.Router();

let _conn: IConnection;
/* GET home page. */
router.post('/lab/history',(req,res,next) => {
  const cid = req.body.cid;

  if (cid) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return chronicModel.labHistory(_conn, cid);
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

router.post('/chronicfu/history',(req,res,next) => {
  const cid = req.body.cid;

  if (cid) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return chronicModel.chronicFuHistory(_conn, cid);
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

router.post('/admission',(req,res,next) => {
  const cid = req.body.cid;

  if (cid) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return chronicModel.admission(_conn, cid);
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

router.post('/admission/home-drug',(req,res,next) => {
  const hospcode = req.body.hospcode;
  const pid = req.body.pid;
  const an = req.body.an;

  if (hospcode && pid && an) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return chronicModel.admissionHomeDrug(_conn, hospcode, pid, an);
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

export default router;
