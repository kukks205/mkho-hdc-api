import { IConnection } from 'mysql';
import * as moment from 'moment';

export class WbcModel {
  history(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select nbc.*, h1.hospname as owner_hospname, h2.hospname as service_hospname, 
        pt.TYPEAREA, r.bcareresult as result_name, f.food as food_name
        from newborncare as nbc
        left join chospcode as h1 on h1.hospcode=nbc.HOSPCODE 
        left join chospcode as h2 on h2.hospcode=nbc.BCPLACE 
        inner join person as pt on pt.HOSPCODE=nbc.HOSPCODE and pt.PID=nbc.PID
        left join cbcareresult as r on r.id_bcareresult=nbc.BCARERESULT
        left join cfood as f on f.id_food=nbc.FOOD
        where concat(nbc.HOSPCODE, nbc.PID) in (
          select concat(p.HOSPCODE, p.pid) as hpid 
          from person as p
          where p.cid=?
          )
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  vaccineHistory(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
          select e.*, p.TYPEAREA, h1.hospname as owner_hospname,
          h2.hospname as service_hospname, cv.thvaccine as vaccine_name
          from epi as e
          left join chospcode as h1 on h1.hospcode=e.HOSPCODE 
          left join chospcode as h2 on h2.hospcode=e.VACCINEPLACE 
          left join cvaccinetype as cv on cv.id_vaccinetype=e.VACCINETYPE
          inner join person as p on p.HOSPCODE=e.HOSPCODE and p.PID=e.PID
          where concat(e.HOSPCODE, e.PID) in (
            select concat(p.HOSPCODE, p.pid) as hpid 
            from person as p
            where p.cid=?
          ) order by e.DATE_SERV DESC
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

}
