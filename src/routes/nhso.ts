'use strict';

import * as express from 'express';
const router = express.Router();
const easysoap = require('easysoap');

/* GET home page. */
router.post('/check-right',(req,res,next) => {
  const cid = req.body.cid;
  const userCid = req.body.userCid;
  const smcToken = req.body.smcToken;

  if (cid && userCid && smcToken) {

      const args = {
        user_person_id: userCid,
        person_id: cid,
        smctoken: smcToken
      };

      const params = {
        host: 'http://ucws.nhso.go.th:80',
        path: '/ucwstokenp1/UCWSTokenP1',
        wsdl: '/ucwstokenp1/UCWSTokenP1?wsdl',
      };

      const soapClient = easysoap.createClient(params);

      soapClient.call({
        method: 'searchCurrentByPID',
        params: args
      })
        .then((callResponse) => {
          var jsonData = soapClient.getXmlDataAsJson(callResponse.response.body);
          let responData = jsonData.searchCurrentByPIDResponse.return;
          console.log(responData.ws_status)
          console.log(responData.ws_status_desc)
          res.send({ ok: true, results: jsonData.searchCurrentByPIDResponse.return});
        })
        .catch((err) => {
          console.log(err);
          res.send({ ok: false, error: err });
        });    

  } else { 
    res.send({ok: false, message: 'กรุณาระบุข้อมูลให้ครบถ้วน'})
  }
});

export default router;
