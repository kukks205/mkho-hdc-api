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

  getDuplicated(connection: IConnection, hospcode: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select p.CID, p.PID, p.HN, concat(p.NAME, " ", p.LNAME) as ptname, 
        TIMESTAMPDIFF(year,p.BIRTH,current_date()) as age,
        date_format(p.BIRTH, "%Y-%m-%d") as BIRTH, p.SEX, p.TYPEAREA,
        (
          select count(*) as t 
          from person as p2 
          where p2.HOSPCODE<>p.HOSPCODE 
          and p2.PID<>p.PID 
          and p.CID=p2.CID 
          and p2.TYPEAREA in ('1', '3')
        ) as total
        from person as p
        where p.HOSPCODE=?
        and (
          select count(*) as t 
          from person as p2 
          where p2.HOSPCODE<>p.HOSPCODE 
          and p2.PID<>p.PID 
          and p.CID=p2.CID 
          and p2.TYPEAREA in ('1', '3')) > 0
        and p.TYPEAREA in ('1', '3')
        group by p.CID
        order by p.NAME, p.LNAME
      `;
      // run query
      connection.query(sql, [hospcode], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  getDuplicatedList(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select concat(p.NAME, " ", p.LNAME) as ptname,
        p.PID as pid, p.HN as hn, p.SEX as sex, 
        date_format(p.BIRTH, '%Y-%m-%d') as birth,
        TIMESTAMPDIFF(year,p.BIRTH,current_date()) as age,
        p.TYPEAREA as typearea,p.HOSPCODE as hospcode, h.hospname, 
        date_format(p.D_UPDATE, '%Y-%m-%d %H:%m:%s') as d_update,
        cd.dischargedesc as discharge_name
        from person as p
        left join chospcode as h on h.hospcode=p.HOSPCODE
        left join cdischarge as cd on cd.dischargecode=p.DISCHARGE
        where p.CID=?
        and p.TYPEAREA in ('1', '3')
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
