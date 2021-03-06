const util = require('util');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const sessions = require(path.join(__dirname,"sessions.js"));
const db = require(path.join(__dirname, "..", "..", "web_DB.js"));

exports.select_status = function(){
	var self = this;
	var result = {'success':true,'data':''};
	
	var sql = "select " +
		"STATUS, " +
		"NAME " +
		"from tb_dict_status";
	
	db.query(sql,function(){
		if(arguments.length==1){
			result['data'] = arguments[0];
			self.responseDirect(200,"text/json",JSON.stringify(result));
		}else{
			result = {'success':false,'message':'数据查询有问题，请联系管理员'};
			self.responseDirect(200,"text/json",JSON.stringify(result));
		}
	})
};