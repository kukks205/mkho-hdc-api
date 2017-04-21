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

  getAncTarget(connection: IConnection, hospcode: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select p.HOSPCODE as hospcode, p.PID as pid, p.CID as cid, concat(p.NAME, " ", p.LNAME) as ptname, 
        date_format(p.BIRTH, '%Y-%m-%d') as birth, TIMESTAMPDIFF(year, p.BIRTH, current_date()) as age, p.SEX as sex,
        t.gravida, date_format(t.bdate, '%Y-%m-%d') as bdate, t.bhosp, t.input_bhosp,
        t.g1_ga, date_format(t.g1_date, '%Y-%m-%d') as g1_date, t.g1_hospcode, t.g1_input_hosp,
        t.g2_ga, date_format(t.g2_date, '%Y-%m-%d') as g2_date, t.g2_hospcode, t.g2_input_hosp,
        t.g3_ga, date_format(t.g3_date, '%Y-%m-%d') as g3_date, t.g3_hospcode, t.g3_input_hosp,
        t.g4_ga, date_format(t.g4_date, '%Y-%m-%d') as g4_date, t.g4_hospcode, t.g4_input_hosp,
        t.g5_ga, date_format(t.g5_date, '%Y-%m-%d') as g5_date, t.g5_hospcode, t.g5_input_hosp
        from t_person_anc as t
        inner join person as p on p.HOSPCODE=t.hospcode and p.PID=t.pid
        where t.hospcode = ?
        and t.typearea in ('1', '3')
        group by t.pid, t.gravida
      `;
      // run query
      connection.query(sql, [hospcode], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
