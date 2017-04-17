'use strict';

import * as express from 'express';
import * as crypto from 'crypto';

import { IConnection } from 'mysql';
import { Jwt } from '../models/jwt';
import { LoginModel } from '../models/login';
import { Connection } from '../models/connection';

const router = express.Router();
const jwt = new Jwt();
const loginModel = new LoginModel();
const connection = new Connection();

router.post('/', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  console.log(req.body);  

  if (username && password) {
    let encPassword = crypto.createHash('md5').update(password).digest('hex');

    let _conn: IConnection;
    
    connection.getConnection()
      .then((conn: IConnection) => {
        _conn = conn;
        return loginModel.doLogin(conn, username, encPassword);
      })
      .then((results: any) => {
        if (results.length) {
          const payload = { id: results[0].id, firstname: results[0].firstname, lastname: results[0].lastname };
          const token = jwt.sign(payload);
          res.send({ ok: true, token: token })
        } else {
          res.send({ ok: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่าน ไม่ถูกต้อง' })
        }
        _conn.destroy();
      })
      .catch(err => {
        _conn.destroy();
        console.log(err);
        res.send({ ok: false, message: 'Server error!' });
      })
  } else {
    res.send({ ok: false, message: 'กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน' })
  }
})

export default router;