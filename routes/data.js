const express = require('express');
const path = require('path');
const pool = require('../config/db_config');
const req = require('express/lib/request');
const mysql = require('mysql2/promise');
const conn = require('../config/db_config');
const router = express.Router();

//주별/월별 매출액
router.get('/getSales/:type/:id', async function (req, res) {
  var sql_month="select recent_month.month, IFNULL(sales_month.sales, 0) as sales from ( "
    + "SELECT date_format(date_sub(NOW(), INTERVAL minus MONTH), '%Y-%m') as month "
    + "from minus_month) recent_month "
    + "LEFT JOIN sales_month on recent_month.month=sales_month.month "
    + "and sales_month.gym_Id=? ORDER BY recent_month.month;";
  var sql_week="select recent_week.week_start, recent_week.week_end, recent_week.week, "
  + "IFNULL(sales_week.sales, 0) as sales from (SELECT "
  + "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (DAYOFWEEK(NOW())-minus_week.start) DAY), '%Y/%m/%d') as week_start, "
  + "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (DAYOFWEEK(NOW())-minus_week.end) DAY), '%Y/%m/%d') as week_end, "
  + "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (DAYOFWEEK(NOW())-minus_week.start) DAY), '%Y%U') as week "
  + "FROM minus_week) recent_week "
  + "LEFT JOIN sales_week on recent_week.week=sales_week.week and sales_week.gym_id=? ORDER BY recent_week.week;";

  var id = Number(req.params.id);
  var sql = sql_week;
  if(req.params.type === 'month')
    sql = sql_month;
  
  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//주별/월별 예약 수
router.get('/getReservation/:type/:id', async function (req, res) {
  var sql_month="select recent_month.month, IFNULL(reservation_month.reservation, 0) as reservation from ( "
    + "SELECT date_format(date_sub(NOW(), INTERVAL minus MONTH), '%Y-%m') as month "
    + "from minus_month) recent_month "
    + "LEFT JOIN reservation_month on recent_month.month=reservation_month.month "
    + "and reservation_month.gym_Id=? ORDER BY recent_month.month";
  var sql_week="select recent_week.week_start, recent_week.week_end, recent_week.week, "
  + "IFNULL(reservation_week.reservation, 0) as reservation from (SELECT "
  + "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (DAYOFWEEK(NOW())-minus_week.start) DAY), '%Y/%m/%d') as week_start, "
  + "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (DAYOFWEEK(NOW())-minus_week.end) DAY), '%Y/%m/%d') as week_end, "
  + "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (DAYOFWEEK(NOW())-minus_week.start) DAY), '%Y%U') as week "
  + "FROM minus_week) recent_week "
  + "LEFT JOIN reservation_week on recent_week.week=reservation_week.week and reservation_week.gym_id=? "
  + "ORDER BY recent_week.week;";

  var id = Number(req.params.id);
  var sql = sql_week;
  if(req.params.type === 'month')
    sql = sql_month;

  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//한 번에 이용하는 시간
router.get('/getTime/:type/:id', async function (req, res) {
  var sql = "SELECT end_time - start_time as time, count(*) as count FROM reservation "
  + "WHERE date BETWEEN DATE_ADD(NOW(), INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_id=? group by time ORDER BY time"

  var id = Number(req.params.id);
  
  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//한 번에 이용하는 사람 수
router.get('/getPlayer/:type/:id', async function (req, res) {
  var sql = "SELECT player, count(*) as count FROM reservation "
  + "WHERE date BETWEEN DATE_ADD(NOW(), INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_id=? group by player ORDER BY player";

  var id = Number(req.params.id);

  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//한 번에 이용하는 코트 수
router.get('/getCourt/:type/:id', async function (req, res) {
  var sql = "SELECT court, count(*) as count FROM reservation "
  + "WHERE date BETWEEN DATE_ADD(NOW(), INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_id=? group by court ORDER BY court"

  var id = Number(req.params.id);
  
  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//전체 체육관 대상 주별/월별 매출 순위
router.get('/getSalesRanking/:type/:id', async function (req, res) {
  var sql = "SELECT gym_info.gym_name, sum(amount) as sales, rank() over (order by sum(amount) desc) as ranking "
  + "FROM reservation, gym_info WHERE date BETWEEN DATE_ADD(NOW(),INTERVAL -1 " + req.params.type + " ) AND NOW()" 
  + "AND gym_info.gym_id=reservation.gym_id group by reservation.gym_id;"

  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//전체 체육관 대상 주별/월별 예약 수 순위
router.get('/getReservationRanking/:type/:id', async function (req, res) {
  var sql = "SELECT gym_info.gym_name, count(*) as count, rank() over (order by count(*) desc) as ranking "
  + "FROM reservation, gym_info WHERE date BETWEEN DATE_ADD(NOW(),INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_info.gym_id=reservation.gym_id group by reservation.gym_id;"

  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//운영하는 체육관 대상 주별/월별 매출 순위
router.get('/getMySalesRanking/:type/:id', async function (req, res) {
  var sql = "SELECT gym_info.gym_name, sum(amount) as sales, rank() over (order by sum(amount) desc) as ranking "
  + "FROM reservation, gym_info WHERE date BETWEEN DATE_ADD(NOW(),INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_info.gym_id=reservation.gym_id AND gym_info.gym_id in (select gym_id from gym_info where host_id=?) "
  + "group by reservation.gym_id;"

  var host = req.user.host_id;

  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, host);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//운영하는 체육관 대상 주별/월별 예약 수 순위
router.get('/getMyReservationRanking/:type/:id', async function (req, res) {
  var sql = "SELECT gym_info.gym_name, count(*) as count, rank() over (order by count(*) desc) as ranking "
  + "FROM reservation, gym_info WHERE date BETWEEN DATE_ADD(NOW(),INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_info.gym_id=reservation.gym_id AND gym_info.gym_id in (select gym_id from gym_info where host_id=?) "
  + "group by reservation.gym_id;"

  var host = req.user.host_id;

  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, host);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//같은 종목의 체육관 대상 주별/월별 매출 순위
router.get('/getSportsSalesRanking/:type/:id', async function (req, res) {
  var sql = "SELECT gym_info.gym_name, sum(amount) as sales, rank() over (order by sum(amount) desc) as ranking "
  + "FROM reservation, gym_info WHERE date BETWEEN DATE_ADD(NOW(),INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_info.gym_id=reservation.gym_id AND gym_info.sports = (select sports from gym_info where gym_id=?) "
  + "group by reservation.gym_id;"


  var id = req.params.id;
  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

//같은 종목의 체육관 대상 주별/월별 예약 수 순위
router.get('/getSportsReservationRanking/:type/:id', async function (req, res) {
  var sql = "SELECT gym_info.gym_name, count(*) as sales, rank() over (order by count(*) desc) as ranking "
  + "FROM reservation, gym_info WHERE date BETWEEN DATE_ADD(NOW(),INTERVAL -1 " + req.params.type + " ) AND NOW() "
  + "AND gym_info.gym_id=reservation.gym_id AND gym_info.sports = (select sports from gym_info where gym_id=?) "
  + "group by reservation.gym_id;"


  var id = req.params.id;
  let connection = await pool.getConnection(async conn => conn);

  try{
    let [result] = await connection.query(sql, id);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"});
  }
})

module.exports = router;