import { IConnection } from 'mysql';
import * as moment from 'moment';

export class ChronicModel {
  labHistory(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select l.*, lt.TH as new_name, lt2.labtest as old_name, p.TYPEAREA,
        h.hospname
        from labfu as l
        left join clabtest_new as lt on lt.code=l.LABTEST
        left join clabtest as lt2 on lt2.id_labtest=l.LABTEST
        left join chospcode as h on h.hospcode=l.HOSPCODE 
        inner join person as p on p.HOSPCODE=l.HOSPCODE and p.PID=l.PID
        where concat(l.HOSPCODE, l.PID) in (
          select concat(p.HOSPCODE, p.pid) as hpid 
          from person as p
          where p.cid=?
          ) order by l.DATE_SERV DESC
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  chronicFuHistory(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select f.*, p.TYPEAREA, h.hospname, cr.retina as retina_name, cf.foot as foot_name
        from chronicfu as f
        left join chospcode as h on h.hospcode=f.HOSPCODE 
        left join cretina as cr on cr.id_retina=f.RETINA
        left join cfoot as cf on cf.id_foot=f.FOOT
        inner join person as p on p.HOSPCODE=f.HOSPCODE and p.PID=f.PID
        where concat(f.HOSPCODE, f.PID) in (
          select concat(p.HOSPCODE, p.pid) as hpid 
          from person as p
          where p.cid=?
          ) order by f.DATE_SERV DESC
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  admission(connection: IConnection, cid: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select a.*, ct.typein as typein_name, ins.instype_name,
        dc.dischstatus as dischstatus_name, dt.disctype as disctype_name,
        h.hospname, h1.hospname as refer_hospname
        from admission as a
        left join ctypein as ct on ct.id_typein=a.TYPEIN
        left join cinstype as ins on ins.id_instype=a.INSTYPE
        left join cdischstatus as dc on dc.id_dischstatus=a.DISCHSTATUS
        left join cdisctype as dt on dt.id_disctype=a.DISCHTYPE
        left join chospcode as h on h.hospcode=a.HOSPCODE 
        left join chospcode as h1 on h1.hospcode=a.REFEROUTHOSP 
        where concat(a.HOSPCODE, a.PID) in (
          select concat(p.HOSPCODE, p.pid) as hpid 
          from person as p
          where p.cid=?
          ) order by a.DATETIME_ADMIT DESC
      `;
      // run query
      connection.query(sql, [cid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  admissionHomeDrug(connection: IConnection, hospcode: string, pid: string, an: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select i.*, cu.unit as unit_name
        from drug_ipd as i
        left join cunit as cu on cu.id_unit=i.UNIT
        where i.TYPEDRUG='2'
        and i.HOSPCODE=?
        and i.PID=?
        and i.AN=?
      `;
      // run query
      connection.query(sql, [hospcode, pid, an], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  chronicNotRegister(connection: IConnection, hospcode: string, start: string, end: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select t.cid, concat(p.NAME, " ", p.LNAME) as ptname, date_format(p.BIRTH, '%Y-%m-%d') as BIRTH, TIMESTAMPDIFF(year,p.BIRTH,current_date()) as age, 
        p.SEX, p.TYPEAREA as typearea, t.input_hosp, 
        group_concat(t.diagcode) as dxcode, date_format(t.date_dx, '%Y-%m-%d') as date_dx, t.hosp_dx, t.source_tb,
        h1.hospname as input_hospname
        from t_chronic as t
        inner join person as p on p.HOSPCODE=t.p_hospcode and p.CID=t.cid
        left join chospcode as h1 on h1.hospcode=t.input_hosp
        where t.source_tb != 'chronic'
        and t.p_hospcode=?
        and t.date_dx between ? and ?
        and t.p_typearea in ('1', '3')
        and ((t.diagcode between 'I10' and 'I15') or (t.diagcode between 'E10' and 'E149'))
        group by t.cid
      `;
      // run query
      connection.query(sql, [hospcode, start, end], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
