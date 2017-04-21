import { IConnection } from 'mysql';
import * as moment from 'moment';

export class AncModel {
  getAncHistory(connection: IConnection, cid: string, gravida: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select a.*, h1.hospname as owner_hospname, h2.hospname as service_hospname, p.TYPEAREA
        from anc as a
        inner join person as p on p.HOSPCODE=a.HOSPCODE and p.PID=a.PID
        left join chospcode as h1 on h1.hospcode=a.HOSPCODE 
        left join chospcode as h2 on h2.hospcode=a.ANCPLACE 
        where concat(a.HOSPCODE, a.PID) in (
        select concat(p.HOSPCODE, p.pid) as hpid 
        from person as p
        where p.cid=?
        ) and a.gravida=? 
        order by a.DATE_SERV
      `;
      // run query
      connection.query(sql, [cid, gravida], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  getPostHistory(connection: IConnection, cid: string, gravida: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select po.*, h.hospname, p.TYPEAREA, cp.ppresult as ppresult_name
        from postnatal as po
        left join chospcode as h on h.hospcode=po.HOSPCODE 
        inner join person as p on p.HOSPCODE=po.HOSPCODE and p.PID=po.PID
				left join cppresult as cp on cp.id_ppresult=po.PPRESULT
        where concat(po.HOSPCODE, po.PID) in (
        select concat(p.HOSPCODE, p.pid) as hpid 
        from person as p
        where p.cid=?
        )
        and po.GRAVIDA=?
        order by po.PPCARE
      `;
      // run query
      connection.query(sql, [cid, gravida], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
