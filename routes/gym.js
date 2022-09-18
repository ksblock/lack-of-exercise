const express = require('express');
const path = require('path');
const pool = require('../config/db_config');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');
const mysql = require('mysql2/promise');
const { append, type } = require('express/lib/response');
const Connection = require('mysql/lib/Connection');
const spawn = require('child_process').spawn;

const router = express.Router();


router.get('/', function (req, res) {
    return res.redirect("/list");
})

//본인 소유의 체육관 목록 조회
router.get('/list', async function (req, res) {
  var id = req.user.host_id;
  var sql = 'select gym_id, gym_name, sports from gym_info where host_id=?;';
  var sqls = mysql.format(sql, id);
  
  let connection = await pool.getConnection(async conn => conn);
  try{
    let [result] = await connection.query(sqls);
    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send("실패");
  }
  
})

//특정 체육관 정보 조회
router.get('/detail/:id', async function (req, res) {
  
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).send({message:"실패"});
  }

  //체육관 일반 정보, 운영 정보, 사업자 정보 각자 조회 
  var sql1 = 'select * from gym_info where gym_id=?;';
  var sql2 = 'select * from gym_registration where gym_id=?;';
  var sql3 = 'select * from gym_operation where gym_id=?;';

  var sql1s = mysql.format(sql1, id);
  var sql2s = mysql.format(sql2, id);
  var sql3s = mysql.format(sql3, id);

  let connection = await pool.getConnection(async conn => conn);
  try{
    let [result] = await connection.query(sql1s + sql2s + sql3s);

    connection.release();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send("실패");
  }
})

//체육관 등록과정 1: 일반 정보 입력
router.post('/signup/gyminfo', async function (req, res) {
  const param_info = [req.body.gym_name, req.user.host_id, req.body.email, req.body.phone, req.body.location, req.body.state, req.body.city, req.body.sports];
  const param_id = [req.body.gym_name, req.user.host_id, req.body.sports];

  var sql1 = 'INSERT INTO gym_info VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?);'
  var sql2 = 'SELECT gym_id from gym_info where gym_name=? and host_id=? and sports=?;';

  var sql1s = mysql.format(sql1, param_info);
  var sql2s = mysql.format(sql2, param_id);
  
  let connection = await pool.getConnection(async conn => conn);
  try{
    let [results] = await connection.query(sql1, param_info);
    let [rows] = await connection.query(sql2, param_id); 
    
    var result_json = rows[0]['gym_id'];
    
    connection.release();

    return res.send({gym_id: result_json});
  }catch(err){
    console.log(err);
    connection.release();
    return res.send({message: "에러 발생"});
  }
})

//체육관 등록과정 2: 운영 정보 입력
router.post('/signup/operation', async function (req, res) {
  const param_op = [req.body.gym_id, req.body.start_time, req.body.end_time, req.body.price, req.body.court,
    req.body.player_per_court, req.body.description];
  var sql1 = 'INSERT INTO gym_operation VALUES(?, ?, ?, ?, ?, ?, ?);'

  let connection = await pool.getConnection(async conn => conn);
  try{
    let [results] = await connection.query(sql1, param_op);
    connection.release();
    return res.send({message: "운영 정보 등록"});
  }catch(err){
    console.log(err);
    connection.release();
    return res.send({message: "에러 발생"});
  }
})

//체육관 등록과정 3: 사업자 정보 입력 
router.post('/signup/registration', async function (req, res) {
  const param_reg = [req.body.gym_id, req.body.reg_num, req.body.reg_date, req.body.host_name];

  var sql1 = 'INSERT INTO gym_registration VALUES(?, ?, ?, ?);'
  var sql2 = 'SELECT gym_info.gym_id as id, gym_info.gym_name as name, gym_info.state, gym_info.city, '
  + 'gym_info.sports, gym_operation.price, gym_operation.court, gym_operation.player_per_court as player '
  +'from gym_info, gym_operation where gym_info.gym_id = gym_operation.gym_id and gym_info.gym_id=?';
  
  let connection = await pool.getConnection(async conn => conn);
  try{
    //사업자 등록번호 저장
    let [results] = await connection.query(sql1, param_reg);
    let [result] = await connection.query(sql2, req.body.gym_id);

    connection.release();

    //추천을 위한 유사도 행렬 갱신
    parameter = JSON.stringify(result[0]);
    const update_sim = spawn('python', ['recommendation/make_sim.py', parameter, ]);

    update_sim.stdout.on('data', (result)=>{
      py_result = result.toString('utf-8');
      console.log(py_result);
    });

    return res.send({message: "사업자 등록 정보 등록"});
  }catch(err){
    console.log(err);
    connection.release();
    return res.send({message: "에러 발생"});
  }
})

//사업자 등록번호 진위 확인
router.post('/checkCompany', async (req, res) => {
  const url = 'http://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=' + process.env.serviceKey + '&returnType=JSON';

  var input = {
    "businesses": [
      {
        "b_no": req.body.reg_num,
        "start_dt": req.body.reg_date,
        "p_nm": req.body.host_name
      }
    ]
  }
  
  try {
    //사업자 등록번호 진위 확인 API 사용
    const result = await axios({
        url: url,
        method: 'post',
        data: input
        });

        var valid_result = result.data['data'][0]['valid'];
        if(valid_result === '01')
            res.status(200).send('인증');
        else
            res.status(200).send('인증 실패');        
    } catch(error) {
        console.log(error);
        res.send("error");
    }
    
})

//체육관 정보 갱신
router.post('/update/:id', async function (req, res) {
  var update_gym_id = Number(req.params.id);
  var key = Object.keys(req.body);

  let connection = await pool.getConnection(async conn => conn);
  try{
    for(var i=0;i<key.length;i++)
    {
      var info = ["gym_name", "location", "sports", "phone", "email"];
      var table = "gym_operation";

      //갱신하는 정보에 맞는 테이블 찾기
      for(var j = 0; j < info.length; j++)
      {
        if(info[j] === key[i])
        {
          table = "gym_info";
          break;
        }
      }
      console.log(table);

      //정보 수정
      var sql = "UPDATE " + table + " SET " + key[i] + "=? WHERE gym_id = ?";
      var params = [req.body[key[i]], update_gym_id];
      let [results] = await connection.query(sql, params);
    }
  }catch(err){
    console.log(err);
  }finally{
    connection.release();
  }

  res.send({message: "정보 수정 성공"});
})

//체육관 예약 현황 확인
router.get('/reservationInfo/:id', async function (req, res) {
  var id = req.params.id;
  var params = [id, req.body.date];

  //오늘 날짜 포함, 오늘 이후의 예약 상황 검색
  var sql = 'SELECT user_info.user_name, reservation.date, reservation.start_time, reservation.end_time, '
  +'reservation.description, reservation.court '
  + 'FROM reservation, user_info '
  + 'WHERE date >= NOW() and reservation.gym_id=? and reservation.user_id=user_info.user_id '
  + 'and date = ? '
  + 'order by reservation.date;'
  

  let connection = await pool.getConnection(async conn => conn);
  try{
    [result] = await connection.query(sql, params);
    connection.release();
    for(var i = 0; i< result.length;i++)
      result[i]['date'] = result[i]['date'].toLocaleDateString();
    res.send(result);
  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "fail"});
  }
})

module.exports = router;