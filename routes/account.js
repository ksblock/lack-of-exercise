const express = require('express');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../config/db_config');
const req = require('express/lib/request');
const axios= require('axios');
const mysql = require('mysql2/promise');

const router = express.Router();

//같은 아이디가 있는지 확인
router.post('/idCheck', async function (req, res) {
  const param = [req.body.id];
  //id 검색
  var sql = 'SELECT count(*) FROM host_info WHERE id = ?';

  let connection = await pool.getConnection(async conn => conn);
  try{
    let [result] = await connection.query(sql, param);
    connection.release();

    
    if(result[0]['count(*)'] === 0)//id 사용 가능
      res.send({status:200, result:0, message: "사용가능"});
    else//id 사용 불가
      res.send({status:200, result:1, message: "사용 불가"});

  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"})
  }
})

//체육관 운영자 등록
router.post('/signup/host', async function (req, res) {
  const param_host = [req.body.host_name, req.body.id, req.body.pw, req.body.phone, req.body.email];
  var sql1 = 'INSERT INTO host_info VALUES(NULL, ?, ?, ?, ?, ?);'
  var sql1s = mysql.format(sql1, param_host);
  
  let connection = await pool.getConnection(async conn => conn);
  try{
    let [result] = await connection.query(sql1s);    
    connection.release();
    
    res.send({message: "회원가입 성공"});

  }catch(err){
    console.log(err);
    connection.release();
    res.send({message: "에러 발생"})
  }
})

//로그인
router.post('/login', passport.authenticate('local'), function(req, res){
	  console.log(req.user);
	  res.send({message: "로그인 성공", user: req.user});
  }
);

//로그아웃
router.get('/logout', function (req, res) {
    req.logout();
    res.send("로그아웃");
})

//로그인한 사용자 이름 표시
router.get('/getHost', function (req, res) {
  if(req.user){
    res.send(req.user.host_name);
  }
  else{
    res.send({message: "로그인 상태가 아님"});
  }
})

module.exports = router;