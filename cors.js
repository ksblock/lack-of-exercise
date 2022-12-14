module.exports = (options) => {
	let optionsCallback = (req, res, callback) => {
		callback(null, options);
	};

	return (req, res, next) => {
		optionsCallback(req, res, (err, options) => {
			let origin;
			let origins = options.origins;
			
			//화이트리스트 확인 - cors를 허용하는 origin인지 확인
			for(let i = 0; i< origins.length; i++){
				if(req.headers.origin === origins[i]) {
					origin = origins[i];
				}
			}

			//request 헤더 설정
			res.set("Access-Control-Allow-Origin", origin || "*");
			res.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
			res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.set("Access-Control-Allow-Credentials", true);
			next();
		});
	};
};

