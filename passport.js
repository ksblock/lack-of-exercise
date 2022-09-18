const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql2/promise');
const pool = require('./config/db_config');

module.exports = () => {
  //사용자 id 정보를 담은 쿠키 생성 
  passport.serializeUser(function(user, done) {
      done(null, user.host_id);
    });

  //사용자 id로 사용자 식별하기
  passport.deserializeUser(function(id, done) {
      var userinfo;
      var sql = 'SELECT * FROM host_info where host_id=?';
      conn.query(sql, [id], function(err, result) {
        if(err)
          console.log(err);

        var json = JSON.stringify(result[0]);
        userinfo = JSON.parse(json);
        done(null, userinfo);
      })
  });
 
  //로그인 검증
  passport.use(new LocalStrategy({
      usernameField: 'id',
      passwordField: 'pw',
	    session: true
    },
    async function(username, password, done) {
      var sql = 'SELECT * FROM host_info WHERE id=? and pw=?';
      let connection = await pool.getConnection(async conn => conn);
          
      try{
        let [result] = await connection.query(sql, [username, password]);
            
        if(result.length === 0){ //로그인 실패
          connection.release();
          return done(null, false, {message: 'Incorrect'});
        }
        else{ //로그인 성공
          var json = JSON.stringify(result[0]);
          var gyminfo = JSON.parse(json);
          connection.release();
          return done(null, gyminfo);
        }
      }catch(err){
        console.log(err);
        connection.release();
      }
    }
  ));
};
