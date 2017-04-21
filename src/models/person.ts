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

  getDeathNoRegister(connection: IConnection, hospcode: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select p.HOSPCODE as hospcode, p.PID as pid, p.HN as hn, p.CID as cid, concat(p.NAME, " ", p.LNAME) as ptname,
        date_format(p.BIRTH, "%Y-%m-%d") as birth, TIMESTAMPDIFF(year,p.BIRTH,current_date()) as age,
        p.SEX as sex, p.TYPEAREA as typearea, p.DISCHARGE as discharge, cd.dischargedesc
        from person as p
        left join cdischarge as cd on cd.dischargecode=p.DISCHARGE
        where p.TYPEAREA in ('1', '3')
        and p.HOSPCODE=? and p.DISCHARGE<>'1'
        and p.CID in (
          select distinct p.CID
          from death as d
          inner join person as p on p.HOSPCODE=d.HOSPCODE and p.PID=d.PID
        )
        and p.CID not in (
          select distinct p.CID
          from death as d
          inner join person as p on p.HOSPCODE=d.HOSPCODE and p.PID=d.PID
          where d.HOSPCODE=?
        )
      `;
      // run query
      connection.query(sql, [hospcode, hospcode], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  getDeathNoRegisterInfo(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select d.*, p.TYPEAREA, ct.typeareaname, ch1.hospname as death_hospname,
        tm1.diagtname as cdeath_name, cpg.pregdeathdesc,
        cpd.pdeathdesc, ch2.hospname as input_hospname
        from death as d
        inner join person as p on p.HOSPCODE=d.HOSPCODE and p.PID=d.PID
        inner join chospcode as ch1 on ch1.hospcode=d.HOSPDEATH
        inner join chospcode as ch2 on ch2.hospcode=d.HOSPCODE
        left join cicd10tm as tm1 on tm1.diagcode=d.CDEATH
        left join cpregdeath as cpg on cpg.pregdeathcode=d.PREGDEATH
        left join cpdeath as cpd on cpd.pdeathcode=d.PDEATH
        left join ctypearea as ct on ct.typeareacode=p.TYPEAREA
        where p.CID=?
        limit 1
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  searchPersonWithCid(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select p.HOSPCODE as hospcode, p.CID as cid, p.HN as hn, concat(p.NAME, " ", p.LNAME) as ptname,
        p.SEX as sex, p.BIRTH, timestampdiff(year, p.BIRTH, current_date()) as age,
        p.TYPEAREA as typearea, p.D_UPDATE as d_update, ct.typeareaname, ch.hospname
        from t_person_cid as p
        left join ctypearea as ct on ct.typeareacode=p.TYPEAREA
        left join chospcode as ch on ch.hospcode=p.HOSPCODE
        where p.CID=?
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  getDrugAllergy(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
          select d.*, ct.typedx as typedx_name, ca.alevel as alevel_name,
          ci.informant as informant_name, ch1.hospname, ch2.hospname as informant_hospname
          from drugallergy as d
          left join ctypedx as ct on ct.id_typedx=d.TYPEDX
          left join calevel as ca on ca.id_alevel=d.ALEVEL
          left join cinformant as ci on ci.id_informant=d.INFORMANT
          left join chospcode as ch1 on ch1.hospcode=d.HOSPCODE
          left join chospcode as ch2 on ch2.hospcode=d.INFORMHOSP
          where concat(d.HOSPCODE, d.PID) in 
            (
              select concat(p.HOSPCODE, p.PID) as hpid 
              from person as p 
              where p.CID=?
            )

          group by d.DNAME
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

}
