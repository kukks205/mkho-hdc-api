import { IConnection } from 'mysql';
import * as moment from 'moment';

export class PersonModel {
  getHpid(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select concat(p.HOSPCODE, p.pid) as hpid 
        from person as p
        where p.cid=>
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
