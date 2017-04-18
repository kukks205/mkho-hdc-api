'use strict';

import * as express from 'express';
import { IConnection } from 'mysql';
import * as moment from 'moment';
import * as path from 'path';

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

router.post('/not-register', (req,res,next) => {
  const hospcode = req.body.hospcode;
  const start = process.env.START_DATE;
  const end = process.env.END_DATE;

  if (hospcode ) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return chronicModel.chronicNotRegister(_conn, hospcode, start, end);
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

router.post('/incorrect-diag', (req,res,next) => {
  const hospcode = req.body.hospcode;
  const pid = req.body.pid;
  const dateServ = req.body.dateServ;
  const sourceTb = req.body.sourceTb;

  if (hospcode && pid && dateServ && sourceTb) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        if (sourceTb === 'diag_opd') {
          return chronicModel.getIncorrectDiagOpd(_conn, hospcode, pid, dateServ);
        } else {
          return chronicModel.getIncorrectDiagIpd(_conn, hospcode, pid, dateServ);
        }
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

router.post('/drugs', (req,res,next) => {
  const hospcode = req.body.hospcode;
  const seq = req.body.seq;
  const an = req.body.an;

  if (hospcode && (seq || an)) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        if (seq) {
          return chronicModel.getDrugOpd(_conn, hospcode, seq);
        } else {
          return chronicModel.getDrugIpd(_conn, hospcode, an);
        }
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

router.get('/not-register/excel', (req,res,next) => {
  const hospcode = req.query.hospcode;
  const start = process.env.START_DATE;
  const end = process.env.END_DATE;

  const json2xls = require('json2xls');
  const fse = require('fs-extra');

    if (hospcode ) {
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return chronicModel.chronicNotRegister(_conn, hospcode, start, end);
      })
      .then((result: any) => {
        _conn.destroy();
        //res.send({ ok: true, rows: result });
        let xcel = json2xls(result);
        let tmpDir = process.env.TMP_FOLDER;
        fse.ensureDirSync(tmpDir);

        let fileName = path.join(tmpDir, `${moment().format('x')}.xls`);
        fse.writeFileSync(fileName, xcel, 'binary');
        res.download(fileName, (err) => {
          if (err) {
            res.send({ok: false, message: err})
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
    res.send({ok: false, message: 'ข้อมูลไม่สมบูรณ์'})
  }

});



export default router;
