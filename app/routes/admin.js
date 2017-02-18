'use strict';
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const fse = require("fs-extra");
const pdf = require("html-pdf");
const gulp = require("gulp");
const gulpData = require("gulp-data");
const gulpPug = require("gulp-pug");
const rimraf = require("rimraf");
const connection_1 = require("../models/connection");
const attendances_1 = require("../models/attendances");
const connection = new connection_1.Connection();
const attendancesModel = new attendances_1.AttendancesModel();
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        let _ext = path.extname(file.originalname);
        cb(null, Date.now() + _ext);
    }
});
var upload = multer({ storage: storage });
const router = express.Router();
router.post('/upload', upload.single('file'), (req, res, next) => {
    const csvFile = req.file.path;
    const ext = path.extname(csvFile);
    const startDate = req.body.start;
    const endDate = req.body.end;
    if (ext === '.csv') {
        let csvData = null;
        if (process.env.IMPORT_FILE_ENCODING == 'UCS2') {
            csvData = fs.readFileSync(csvFile, 'ucs2');
        }
        else {
            csvData = fs.readFileSync(csvFile, 'utf8');
        }
        let _data = csvData.toString().split("\n");
        delete _data[0];
        let items = [];
        _data.forEach((v, i) => {
            if (v) {
                let arrItem = v.toString().split(",");
                let employeeCode = arrItem[5];
                let checkinDate = moment(arrItem[3], 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD');
                let checkinTime = moment(arrItem[3], 'DD/MM/YYYY HH:mm:ss').format('HH:mm:ss');
                let importedDate = moment().format('YYYY-MM-DD HH:mm:ss');
                if (employeeCode) {
                    let obj = [];
                    obj.push(employeeCode);
                    obj.push(checkinDate);
                    obj.push(checkinTime);
                    obj.push(importedDate);
                    let isBetween = moment(checkinDate).isBetween(startDate, endDate, null, '[]');
                    if (isBetween) {
                        items.push(obj);
                    }
                }
            }
        });
        if (items.length) {
            let total = 0;
            let _conn;
            connection.getConnection()
                .then((conn) => {
                _conn = conn;
                return attendancesModel.removeAttendances(_conn, startDate, endDate);
            })
                .then(() => {
                return attendancesModel.saveAttendances(_conn, items);
            })
                .then((results) => {
                total = results.affectedRows;
                let importedAt = moment().format('YYYY-MM-DD HH:mm:ss');
                return attendancesModel.saveImportedLog(_conn, importedAt, startDate, endDate, total);
            })
                .then(() => {
                _conn.release();
                res.send({ ok: true, total: total });
            })
                .catch(err => {
                res.send({ ok: false, message: err });
            });
        }
        else {
            res.send({ ok: true, total: 0 });
        }
    }
    else {
        res.send({ ok: false, message: 'รูปแบบไฟล์ไม่ถูกต้อง' });
    }
});
router.get('/imported-logs', (req, res, next) => {
    connection.getConnection()
        .then((conn) => {
        attendancesModel.getImportedLog(conn)
            .then((results) => {
            conn.release();
            let data = [];
            results.forEach(v => {
                let obj = {};
                obj.importedAt = `${moment(v.imported_at).format('D')} ${moment(v.imported_at).locale('th').format('MMM')} ${moment(v.imported_at).get('year') + 543} ${moment(v.imported_at).format('HH:mm')}`;
                obj.start = `${moment(v.start_date).format('D')} ${moment(v.start_date).locale('th').format('MMM')} ${moment(v.start_date).get('year') + 543}`;
                obj.end = `${moment(v.end_date).format('D')} ${moment(v.end_date).locale('th').format('MMM')} ${moment(v.end_date).get('year') + 543}`;
                obj.total = v.total;
                data.push(obj);
            });
            res.send({ ok: true, rows: data });
        })
            .catch(error => {
            console.log(error);
            res.send({
                ok: false,
                code: 500,
                message: "Server error!"
            });
        });
    });
});
router.get('/process-logs', (req, res, next) => {
    connection.getConnection()
        .then((conn) => {
        attendancesModel.getProcessLog(conn)
            .then((results) => {
            conn.release();
            let data = [];
            results.forEach(v => {
                let obj = {};
                obj.processAt = `${moment(v.process_at).format('D')} ${moment(v.process_at).locale('th').format('MMM')} ${moment(v.process_at).get('year') + 543} ${moment(v.process_at).format('HH:mm')}`;
                obj.month = `${moment(v.start_date).locale('th').format('MMMM')} ${moment(v.start_date).get('year') + 543}`;
                obj.total = v.total;
                data.push(obj);
            });
            res.send({ ok: true, rows: data });
        })
            .catch(error => {
            console.log(error);
            res.send({
                ok: false,
                code: 500,
                message: "Server error!"
            });
        });
    });
});
router.get('/initial-logs', (req, res, next) => {
    connection.getConnection()
        .then((conn) => {
        attendancesModel.getInitialLog(conn)
            .then((results) => {
            conn.release();
            let data = [];
            results.forEach(v => {
                let obj = {};
                obj.initialAt = `${moment(v.initial_at).format('D')} ${moment(v.initial_at).locale('th').format('MMM')} ${moment(v.initial_at).get('year') + 543} ${moment(v.initial_at).format('HH:mm')}`;
                let m = `${v.iyear}-${v.imonth}`;
                obj.month = `${moment(m, 'YYYY-MM').locale('th').format('MMMM')} ${moment(m, 'YYYY-MM').get('year') + 543}`;
                data.push(obj);
            });
            res.send({ ok: true, rows: data });
        })
            .catch(error => {
            console.log(error);
            res.send({
                ok: false,
                code: 500,
                message: "Server error!"
            });
        });
    });
});
router.post('/process-summary', (req, res, next) => {
    let start = req.body.start;
    let end = req.body.end;
    if (start && end) {
        connection.getConnection()
            .then((conn) => {
            return attendancesModel.processSummary(conn, start, end);
        })
            .then((results) => {
            res.send({ ok: true, rows: results });
        })
            .catch(err => {
            res.send({ ok: false, message: err });
        });
    }
    else {
        res.send({ ok: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
});
router.post('/process', (req, res, next) => {
    let y = req.body.y;
    let m = req.body.m;
    if (y && m) {
        let ym = `${y}-${m}`;
        let _yearMonth = moment(ym, 'YYYY-MM');
        let unitTime = 'month';
        let start = moment(_yearMonth).startOf(unitTime).format('YYYY-MM-DD');
        let end = moment(_yearMonth).endOf(unitTime).format('YYYY-MM-DD');
        let _conn;
        let total = 0;
        connection.getConnection()
            .then((conn) => {
            _conn = conn;
            return attendancesModel.removeOldProcess(_conn, start, end);
        })
            .then((results) => {
            return attendancesModel.doProcess(_conn, start, end);
        })
            .then((results) => {
            let processAt = moment().format('YYYY-MM-DD HH:mm:ss');
            total = results.affectedRows;
            return attendancesModel.saveProcessLog(_conn, processAt, start, end, total);
        })
            .then(() => {
            res.send({ ok: true, total: total });
        })
            .catch(err => {
            res.send({ ok: false, message: err });
        });
    }
    else {
        res.send({ ok: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
});
router.post('/initial', (req, res, next) => {
    let y = req.body.y;
    let m = req.body.m;
    if (y && m) {
        let ym = `${y}-${m}`;
        let _yearMonth = moment(ym, 'YYYY-MM');
        let unitTime = 'month';
        let start = moment(_yearMonth).startOf(unitTime).format('YYYY-MM-DD');
        let end = moment(_yearMonth).endOf(unitTime).format('YYYY-MM-DD');
        let employees = [];
        let services = [];
        let _conn = null;
        let total = 0;
        connection.getConnection()
            .then((conn) => {
            _conn = conn;
            attendancesModel.getInitialEmployees(conn, start, end)
                .then((results) => {
                if (results.length) {
                    results.forEach(v => {
                        employees.push(v.employee_code);
                    });
                    let _endDate = moment(end, 'YYYY-MM-DD').get('date');
                    let serviceDates = [];
                    for (let i = 0; i <= _endDate - 1; i++) {
                        let _date = moment(start, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
                        serviceDates.push(_date);
                    }
                    employees.forEach((v) => {
                        serviceDates.forEach(d => {
                            let obj = [];
                            obj.push(v);
                            obj.push(d);
                            obj.push('1');
                            obj.push('N');
                            services.push(obj);
                        });
                    });
                    attendancesModel.saveInitial(_conn, services)
                        .then((results) => {
                        total = results.affectedRows;
                        let initialAt = moment().format('YYYY-MM-DD HH:mm:ss');
                        return attendancesModel.saveInitialLog(_conn, initialAt, y, m);
                    })
                        .then(() => {
                        res.send({ ok: true, total: total });
                    })
                        .catch(err => {
                        res.send({ ok: false, message: err });
                    });
                }
                else {
                    res.send({ ok: true, total: 0 });
                }
            })
                .catch(err => {
                res.send({ ok: false, message: err });
            });
        });
    }
    else {
        res.send({ ok: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
});
router.get('/print/:employeeCode/:startDate/:endDate', (req, res, next) => {
    let startDate = req.params.startDate;
    let endDate = req.params.endDate;
    let employeeCode = req.params.employeeCode;
    fse.ensureDirSync('./templates/html');
    fse.ensureDirSync('./templates/pdf');
    var destPath = './templates/html/' + moment().format('x');
    fse.ensureDirSync(destPath);
    let json = {};
    json.startDate = `${moment(startDate).format('D')} ${moment(startDate).locale('th').format('MMMM')} ${moment(startDate).get('year') + 543}`;
    json.endDate = `${moment(endDate).format('D')} ${moment(endDate).locale('th').format('MMMM')} ${moment(endDate).get('year') + 543}`;
    json.items = [];
    let _conn = null;
    connection.getConnection()
        .then((conn) => {
        _conn = conn;
        return attendancesModel.getEmployeeDetail(conn, employeeCode);
    })
        .then(results => {
        json.employee = results[0];
        return attendancesModel.getEmployeeWorkDetail(_conn, employeeCode, startDate, endDate);
    })
        .then((results) => {
        json.results = [];
        results.forEach(v => {
            let obj = {};
            obj.work_date = `${moment(v.work_date).format('D')} ${moment(v.work_date).locale('th').format('MMM')} ${moment(v.work_date).get('year') + 543}`;
            obj.in01 = v.in01 ? moment(v.in01, 'HH:mm:ss').format('HH:mm') : '';
            obj.in02 = v.in02 ? moment(v.in02, 'HH:mm:ss').format('HH:mm') : '';
            let _in03 = v.in03 || v.in03_2;
            obj.in03 = _in03 ? moment(_in03, 'HH:mm:ss').format("HH:mm") : '';
            obj.out01 = v.out01 ? moment(v.out01, 'HH:mm:ss').format('HH:mm') : '';
            let _out02 = v.out02 || v.out02_2;
            obj.out02 = _out02 ? moment(_out02, 'HH:mm:ss').format('HH:mm') : '';
            obj.out03 = v.out03 ? moment(v.out03, 'HH:mm:ss').format('HH:mm') : '';
            obj.late = moment(v.in01, 'HH:mm:ss').isAfter(moment('08:45:59', 'HH:mm:ss')) ? 'สาย' : '';
            json.results.push(obj);
        });
        console.log(json);
        gulp.task('html', (cb) => {
            return gulp.src('./templates/work-time.pug')
                .pipe(gulpData(() => {
                return json;
            }))
                .pipe(gulpPug())
                .pipe(gulp.dest(destPath));
        });
        gulp.task('pdf', ['html'], () => {
            let html = fs.readFileSync(destPath + '/work-time.html', 'utf8');
            let options = {
                format: 'A4',
                orientation: "portrait",
            };
            var pdfName = `./templates/pdf/attendances-${json.employee.employee_name}-${moment().format('x')}.pdf`;
            pdf.create(html, options).toFile(pdfName, (err, resp) => {
                if (err) {
                    res.send({ ok: false, message: err });
                }
                else {
                    res.download(pdfName, function () {
                        rimraf.sync(destPath);
                    });
                }
            });
        });
        gulp.start('pdf');
    })
        .catch(err => {
        res.send({ ok: false, message: err });
    });
});
router.get('/export-excel/:startDate/:endDate', (req, res, next) => {
    let startDate = req.params.startDate;
    let endDate = req.params.endDate;
    let excelFile = moment().format('x') + '.xls';
    if (startDate && endDate) {
        connection.getConnection()
            .then((conn) => {
            return attendancesModel.processSummary(conn, startDate, endDate);
        })
            .then((results) => {
            let options = {
                fields: [
                    'employee_code', 'employee_name', 'department_name',
                    'total_work', 'total_late', 'total_exit_before', 'total_not_exit'
                ]
            };
            res.xls(excelFile, results, options);
        })
            .catch(err => {
            res.send({ ok: false, message: err });
        });
    }
    else {
        res.send({ ok: false, message: 'กรุณาระบุวันที่' });
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = router;
//# sourceMappingURL=admin.js.map