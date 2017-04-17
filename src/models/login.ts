import { IConnection } from 'mysql';
import * as moment from 'moment';

export class LoginModel {
  doLogin(connection: IConnection, username: string, password: string) {
    return new Promise((resolve, reject) => {
      let sql = `
      select id, firstname, lastname, username
      from sys_member
      where username=? and password=?
      `;
      console.log(sql);
      // run query
      connection.query(sql, [username, password], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
