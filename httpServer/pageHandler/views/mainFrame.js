var util = require('util');
var db = require("../../DBManager.js");
var server = require("../../worker/web_worker");
var dbConfig = require("../../Config.js");
var logs = require('../../exports_log');
var validate = require("./sessions").validate;

var TABLE_RTMFP_SERVERDATA = 'server_data_overload';
var dbcfg = new dbConfig();
var res_ver = {};
res_ver.data = new Array();
var live_table = new Array();
var vod_table = new Array();

/*
var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//表名
		useTableAlias,
		"T_m",//别名
		{
			"_asDay":args["type"],//类型（天、小时）
			"_toDate":args["to"],//止于时间
			"_fromDate":args["from"],//起始时间
			"version":[args["verVar"],"version"],//版本
			"gid":[args["gid"],"gid"], //Group ID
			"termType":[args["terminalId"],"termid"],//,平台类型
			"appid":[args["appid"],"appid"], // 应用类型
			"methods":[args["methods"],"methods"], //UTP 或者 WEB
			"p":[args["p"],"p"],  //p=l 私有协议 p=r rtfmp协议
			"sid":[args["sid"],"sid"],  //streamID  一路视频的分享率
			"ch":[args["ch"],"ch"]
		},//where 
		selectElement,//sql   um(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//时间
		);
		
*/
var getMulTableSqlStatementBy_IpPort_Type_Ver_IDC = function ()
{
	var _mulTableName = arguments[0];//��ݷֱ��б�
	var _mulTableAlias = arguments[1];//��ݷֱ�����б�
	var _mergeTableAlias = arguments[2];//�ϱ���ݱ����
	var _condition = arguments[3];//where �����ж�
	var _selectParam = arguments[4];//����ʱ���ѯ���ֶ�����
	var _tbTimeDesc	 = arguments[5];//ʱ���ѯ���ֶ�����
 
	var strDuration;
	var sql = "";
	var mergeTable ="";
	var reg=new RegExp(_mergeTableAlias,"g");
	var asDay = !_condition._asDay || _condition._asDay == "min";
	var reg_websoket = new RegExp("cde","g");
	var reg_websoket_rtmfp = new RegExp("T_m.no_cde_heart+","g");
	var agree = -1;
	var node_sql = " sum(T_m.node_rep_count) node_rep_count ,sum(T_m.no_node_heart) no_node_heart ,sum(T_m.forbid_node_heart) forbid_node_heart ,sum(T_m.zero_node_heart) zero_node_heart ,sum(T_m.one_node_heart) one_node_heart ,sum(T_m.two_node_heart) two_node_heart ,sum(T_m.three_node_heart) three_node_heart ,sum(T_m.four_node_heart) four_node_heart ,sum(T_m.five_node_heart) five_node_heart ,sum(T_m.six_node_heart) six_node_heart ,sum(T_m.other_node_heart) other_node_heart ";
	
	if( _condition.hasOwnProperty("duration") ){
		if ( _condition.duration && _condition.duration.length==1  && Number(_condition.duration) == 1) {
	    strDuration = _mergeTableAlias+".duration";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("protocol") ){
		if ( _condition.protocol && _condition.protocol.length==2) {
	    strDuration = _mergeTableAlias+".bitrate";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_live") ){
		if ( _condition.table_live && _condition.table_live.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_webp2p_cdn") ){
		if ( _condition.table_webp2p_cdn && _condition.table_webp2p_cdn.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_webp2p_user") ){
		if ( _condition.table_webp2p_user && _condition.table_webp2p_user.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_termid_vv") ){
		if ( _condition.table_termid_vv && _condition.table_termid_vv.length==2) {
	    strDuration = _mergeTableAlias+".termid";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("agree") ){
		if ( _condition.agree && _condition.agree.length==2 )
		{
			agree = Number(_condition.agree[0]);
		}
	}
	for(var len=0; len < _mulTableName.length; len++ )
	{
		var tempOtherDesc = _selectParam.replace(reg,_mulTableAlias[len]);
		if(len == _mulTableName.length-1)
		{
			mergeTable += getSqlStatementBy_IpPort_Type_Ver_IDC( 
					_mulTableName[len],
					_mulTableAlias[len],
					_condition,//where 
					tempOtherDesc, 
					_tbTimeDesc//				
				);
		}else{
			mergeTable += getSqlStatementBy_IpPort_Type_Ver_IDC( 
					_mulTableName[len],
					_mulTableAlias[len],
					_condition,//where 
					tempOtherDesc, 
					_tbTimeDesc				
				);
			mergeTable +=" union all ";  
		}
	}
	if(strDuration == undefined){
		if(asDay)
		{
			if(agree == 1 || agree == 2 ||agree == 4 || agree == 5 )
			{
				_selectParam = " ";
				_selectParam = node_sql;
			}
			sql = "select  show_time_segment, "+_selectParam+ " from ("+ mergeTable+") as "+_mergeTableAlias+" group by show_time_segment ;";
		}else
		{
			if(agree == 1 || agree == 2 ||agree == 4 || agree == 5 )
			{
				//_selectParam = _selectParam.replace(reg_websoket,"node");
				_selectParam = " ";
				_selectParam = node_sql;
			}
			sql = "select  show_time_segment, "+_selectParam+ " from ("+ mergeTable+") as "+_mergeTableAlias+" group by show_time_segment ;";
		}
	}
	else {
		if(asDay)
		{
			sql = "select  show_time_segment, "+_selectParam+ " from ("+ mergeTable+") as "+_mergeTableAlias+" group by show_time_segment,"+strDuration+";";
		}
		else{		
			if( _condition.hasOwnProperty("table_webp2p_cdn") ){
				sql = "select  show_time_segment, "+_selectParam+ " from ("+ mergeTable+") as "+_mergeTableAlias+" group by show_time_segment ;";
			}
			else {
				sql = "select  show_time_segment, "+_selectParam+ " from ("+ mergeTable+") as "+_mergeTableAlias+" group by show_time_segment,"+strDuration+";";
			}
		}
	}
	return sql;
}

var getSqlStatementBy_IpPort_Type_Ver_IDC = function ( )
{
	var _tableName = arguments[0];
	var _tableAlias = arguments[1];
	var _condition = arguments[2];
	var _selectParam = arguments[3];
	var _tbTimeDesc	 = arguments[4];
	
	if(!_condition){return "";}
  
  
	var select_ten_minute = "";
	var seg_minute = 10;
	var time_segment = "";
	var date_time = " ";
	var fromDate,toDate,asDay,strSqlType ,sql, table_sql_para="",sql_para="",sql_para2="",strDuration,table_version = "",table_collect = "";
	
	if( _condition.hasOwnProperty("_fromDate") )
	{
		fromDate = new Date( _condition._fromDate );
	}
	
	if(fromDate == null){
		logs.logger.error("error not fromDate!");
		return "";
	}
  
	if( _condition.hasOwnProperty("_toDate") )
	{
		toDate = new Date( _condition._toDate );
	}
	
	if(toDate == null){
		logs.logger.error("error not toDate!");
		return "";
	}
	
	if( _condition.hasOwnProperty("_asDay"))
	{
		asDay = !_condition._asDay || _condition._asDay == "min";
	}
	
	if( _condition.hasOwnProperty("ip") && (Number(_condition["ip"][0]) != 0) ){
		strSqlType = util.format(" and "+_condition["ip"][1]+"='%s' ", 
		_condition["ip"][0]);
		sql_para2 = sql_para2 + strSqlType;
	}
	if( _condition.hasOwnProperty("idc") ){
		if ( _condition.idc && _condition.idc.length==2 && Number(_condition.idc[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.idc[1]+"=%d ", _condition.idc[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("playType") ){
		if ( _condition.playType && _condition.playType.length==2 && Number(_condition.playType[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.playType[1]+"=%d ", _condition.playType[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("version") ){
		if ( _condition.version && _condition.version.length==2 && Number(_condition.version[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.version[1]+"=%d ", _condition.version[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	//-----------------upgrade--------------
	if( _condition.hasOwnProperty("primary") ){
		if ( _condition.primary && _condition.primary.length==2 && Number(_condition.primary[0]) != -1  ) {
	    strSqlType = util.format(" and "+"loc_ver=%d ", _condition.primary[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	if( _condition.hasOwnProperty("aim") ){
		if ( _condition.aim && _condition.aim.length==2 && Number(_condition.aim[0]) != -1  ) {
	    strSqlType = util.format(" and "+"ser_ver=%d ", _condition.aim[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	if( _condition.hasOwnProperty("net_type") ){
		if ( _condition.net_type && _condition.net_type.length == 2  && Number(_condition.net_type[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.net_type[1]+"=%d ", _condition.net_type[0]);
			sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("so") ){
		if ( _condition.so && _condition.so.length == 2  && Number(_condition.so[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.so[1]+"=%d ", _condition.so[0]);
			sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("upgrade_type") ){
		if ( _condition.upgrade_type && _condition.upgrade_type.length == 2  && Number(_condition.upgrade_type[0]) != -1) {		
			strSqlType = util.format(" and "+"type=%d ", _condition.upgrade_type[0]);
			sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("gid") ){
		if ( _condition.gid && _condition.gid.length==2 && Number(_condition.gid[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.gid[1]+"=%d ", _condition.gid[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("sid") ){
		if ( _condition.sid && _condition.sid.length==2 && Number(_condition.sid[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.sid[1]+"=%d ", _condition.sid[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	if( _condition.hasOwnProperty("ch") ){
		if ( _condition.ch && _condition.ch.length==2 && Number(_condition.ch[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.ch[1]+"=%d ", _condition.ch[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("p1") ){
		if ( _condition.p1 && _condition.p1.length==2 && Number(_condition.p1[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.p1[1]+"=%d ", _condition.p1[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("p2") ){
		if ( _condition.p2 && _condition.p2.length==2 && Number(_condition.p2[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.p2[1]+"=\"%s\" ", _condition.p2[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("p3") ){
		if ( _condition.p3 && _condition.p3.length==2 && Number(_condition.p3[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.p3[1]+"=\"%s\" ", _condition.p3[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("p") ){
		if ( _condition.p && _condition.p.length==2 && Number(_condition.p[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.p[1]+"=%d ", _condition.p[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("termType") ){
		if ( _condition.termType && _condition.termType.length==2 && Number(_condition.termType[0]) != -1  ) {
	    strSqlType = util.format(" and "+_condition.termType[1]+"=%d ", _condition.termType[0]);
	    sql_para2 = sql_para2 + strSqlType;
		}
	}
  
	if( _condition.hasOwnProperty("duration") ){
		if ( _condition.duration && _condition.duration.length==1  && Number(_condition.duration) == 1) {
	    strDuration = "duration";
		}
	}	
	
	if( _condition.hasOwnProperty("platid") ){
		if ( _condition.platid && _condition.platid.length == 2  && Number(_condition.platid[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.platid[1]+"=%d ", _condition.platid[0]);
			sql_para2 = sql_para2 + strSqlType;
		}
	}
	if( _condition.hasOwnProperty("splatid") ){
		if ( _condition.splatid && _condition.splatid.length == 2  && Number(_condition.splatid[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.splatid[1]+"=%d ", _condition.splatid[0]);
			sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("protocol") ){
		if ( _condition.protocol && _condition.protocol.length==2 )
		{
			if( Number(_condition.protocol[0]) == 0  ) {
				strSqlType = util.format(" and "+"bitrate in\(58,21,13,22,51,52,53,54 \)");
				sql_para2 = sql_para2 + strSqlType;
			}
			else if( Number(_condition.protocol[0]) == 1 )
			{
				strSqlType = util.format(" and "+"bitrate  in\(57,1,16,17,18,35,20,44 \)");
				sql_para2 = sql_para2 + strSqlType;
			}
			strDuration = "bitrate";
		}else{
			logs.logger.error("termType error!");	
		}
	}
	
	if ( _condition.table_vod && _condition.table_vod.length==2) {
	    strDuration = _mergeTableAlias+".version";
	}else{
		logs.logger.error("strDuration error!");	
	}
	/*
	if( _condition.hasOwnProperty("table_termid_vv") ){
		if ( _condition.table_termid_vv && _condition.table_termid_vv.length==2 ) {
			strSqlType = util.format(" and "+"termid  in\(0,1,2,3,4 \)");
			sql_para2 = sql_para2 + strSqlType;
			strDuration = "termid";
		}else{
			logs.logger.error("table_termid_vv error!");	
		}
	}		
	if( _condition.hasOwnProperty("table_webp2p_cdn") ){
		if ( _condition.table_webp2p_cdn && _condition.table_webp2p_cdn.length==2 ) {
			strSqlType = util.format(" and "+"version  in\( 50, 9, 56, 18 \)");
			sql_para2 = sql_para2 + strSqlType;
			strDuration = " version";
		}else{
			logs.logger.error("version error!");	
		}
	}
	if( _condition.hasOwnProperty("table_webp2p_user") ){
		if ( _condition.table_webp2p_user && _condition.table_webp2p_user.length==2 ) {
			strSqlType = util.format(" and "+"version  in\( 50, 9, 56, 18 \)");
			sql_para2 = sql_para2 + strSqlType;
			strDuration = "version";
		}else{
			logs.logger.error("version error!");	
		}
	}
	*/
	if( _condition.hasOwnProperty("table_all_share") ){
		if ( _condition.table_all_share && _condition.table_all_share.length==2 ) {
			time_segment = " ((select hour(time_stamp) ) >= 00  and (select hour(time_stamp) ) < 24) and  ";
		}else{
			logs.logger.error("table_all_share error!");	
		}
	}

	if(_condition.hasOwnProperty("country") ){
		strSqlType = util.format(" and "+_condition.country[1]+"=%d ", _condition.country[0]);
		sql_para2 = sql_para2 + strSqlType;
	}

	if( _condition.hasOwnProperty("province") ){
		if ( _condition.province && _condition.province.length == 2  && Number(_condition.province[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.province[1]+"=%d ", _condition.province[0]);
			sql_para2 = sql_para2 + strSqlType;
		}
	}
	
	if( _condition.hasOwnProperty("appid") ){
		if ( _condition.appid && _condition.appid.length == 2  && Number(_condition.appid[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.appid[1]+"=%d ", _condition.appid[0]);
			sql_para2 = sql_para2 + strSqlType;
		}else{
			logs.logger.error("appid error!");	
		}
	}
	if( _condition.hasOwnProperty("methods") ){
		if ( _condition.methods && _condition.methods.length == 2  && Number(_condition.methods[0]) != -1) {		
			strSqlType = util.format(" and "+_condition.methods[1]+"=%d ", _condition.methods[0]);
			sql_para2 = sql_para2 + strSqlType;
		}else{
			logs.logger.error("methods error!");	
		}
	}
	
	var fromDateFMT = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + fromDate.getDate();
	var toDateFMT = toDate.getFullYear() + "-" + (toDate.getMonth() + 1) + "-" + (toDate.getDate());
	var fromHour = fromDate.getHours();		
	var toHour = toDate.getHours();
	var toMinute = toDate.getMinutes();
	date_time =  util.format("( time_stamp >= date_format(' %s %s:00:00 ', '%%Y-%%m-%%d %%H:%%i:%%s') and time_stamp <= date_format('%s 23:59:59','%%Y-%%m-%%d %%H:%%i:%%s') ) ",fromDateFMT,fromHour,toDateFMT);
	
	if(asDay)
	{
		select_ten_minute = "concat( (select date(time_stamp)),' ' , (select hour (time_stamp)),':',(select floor((select minute(time_stamp))/10))*10 ) ,'%Y-%m-%d %H:%i')show_time_segment ";
		
		for(var ii=0;ii<60;ii+=seg_minute)
		{
			time_segment +=" ((select minute('time_stamp') ) >= "+ii+" and (select minute('time_stamp') ) < "+(ii+seg_minute)+") ";
			if(ii+seg_minute != 60 )
			{
				time_segment+=" or ";
			}
		}				
	}
	else{
		select_ten_minute = "concat( (select date(time_stamp)),' ' , (select hour (time_stamp)) ) ,'%Y-%m-%d %H')show_time_segment ";
		time_segment = " ((select hour('time_stamp') ) >= 0  and (select hour('time_stamp') ) < 24) ";

	}
	if(strDuration == undefined){ 
		if(asDay)
		{
			sql = "select DATE_FORMAT(" + select_ten_minute+" ,"+ _selectParam + " from "+ _tableName + " where "+date_time +" and  ("+ time_segment+" ) " + sql_para2 +" group by show_time_segment";
		}else
		{
			sql = "select DATE_FORMAT("+select_ten_minute+" , "+_selectParam +" from "+_tableName+ " where "+date_time+ " and ( "+time_segment+" )"+sql_para2+ " group by show_time_segment ";
		}
	}
	else {
		if(asDay)
		{
			sql = "select DATE_FORMAT("+select_ten_minute+" , "+_selectParam +" from "+_tableName+ " where "+date_time+" and ( "+time_segment+" )"+ sql_para2+ " group by show_time_segment ,"+strDuration
		}else
		{
			sql = "select DATE_FORMAT("+select_ten_minute+" , "+_selectParam +" from "+_tableName+ " where "+date_time+" and ( "+time_segment+" )"+ sql_para2+ " group by show_time_segment ,"+strDuration;
		}
	}
	return sql;
	
}






/*

var getRport_forms_IpPort_Type_Ver_IDC = function ()
{
	var _mulTableName = arguments[0];//��ݷֱ��б�
	var _mulTableAlias = arguments[1];//��ݷֱ�����б�
	var _mergeTableAlias = arguments[2];//�ϱ���ݱ����
	var _condition = arguments[3];//where �����ж�
	var _selectParam = arguments[4];//����ʱ���ѯ���ֶ�����
	var _tbTimeDesc	 = arguments[5];//ʱ���ѯ���ֶ�����
	var callback = arguments[6];
	var strDuration;
	var sql = "";
	var mergeTable ="";
	var reg=new RegExp(_mergeTableAlias,"g");
	var asDay = !_condition._asDay || _condition._asDay == "day";
	
	if( _condition.hasOwnProperty("duration") ){
		if ( _condition.duration && _condition.duration.length==1  && Number(_condition.duration) == 1) {
	    strDuration = _mergeTableAlias+".duration";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("protocol") ){
		if ( _condition.protocol && _condition.protocol.length==2) {
	    strDuration = _mergeTableAlias+".bitrate";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_live") ){
		if ( _condition.table_live && _condition.table_live.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_vod") ){
		if ( _condition.table_vod && _condition.table_vod.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_termid") ){
		if ( _condition.table_termid && _condition.table_termid.length==2) {
	    strDuration = _mergeTableAlias+".termid";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_webp2p") ){
		if ( _condition.table_webp2p && _condition.table_webp2p.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_webp2p_cdn") ){
		if ( _condition.table_webp2p_cdn && _condition.table_webp2p_cdn.length==2) {
	    strDuration = _mergeTableAlias+".version";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_p2p_all") ){
		if ( _condition.table_p2p_all && _condition.table_p2p_all.length==2) {
	    strDuration = " ";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_p2p_web") ){
		if ( _condition.table_p2p_web && _condition.table_p2p_web.length==2) {
	    strDuration = " ";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	if( _condition.hasOwnProperty("table_p2p_utp") ){
		if ( _condition.table_p2p_utp && _condition.table_p2p_utp.length==2) {
	    strDuration = " ";
		}else{
			server.logger.error("strDuration error!");	
		}
	}
	for(var len=0; len < _mulTableName.length; len++ )
	{
		var tempOtherDesc = _selectParam.replace(reg,_mulTableAlias[len]);
		if(len == _mulTableName.length-1)
		{
			getRportform_IpPort_Type_Ver_IDC( 
				_mulTableName[len],//��ݱ���
				_mulTableAlias[len],//��ݱ����
				_condition,//where �����ж�
				tempOtherDesc,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
				_tbTimeDesc,//��ʶʱ����ֶ�	
				function(sql_value)
				{
					mergeTable += sql_value;
					//mergeTable +=" union all ";
					sql = "select "+
					"DATE_FORMAT("+_mergeTableAlias+"."+_tbTimeDesc+",'%Y-%m-%d') "+_tbTimeDesc+", "+
					_selectParam+
					" from (" +
					mergeTable+
					" ) as "+_mergeTableAlias+" group by DATE_FORMAT("+_mergeTableAlias+"."+_tbTimeDesc+",'%Y-%m-%d %H'),"+strDuration+";";
					callback( sql);			
				}
			);
		}else{
			getRportform_IpPort_Type_Ver_IDC( 
				_mulTableName[len],//��ݱ���
				_mulTableAlias[len],//��ݱ����
				_condition,//where �����ж�
				tempOtherDesc,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
				_tbTimeDesc,
				function(sql_value)
				{
					mergeTable += sql_value;
					mergeTable +=" union all ";  						
				
					sql = "select "+
					"DATE_FORMAT("+_mergeTableAlias+"."+_tbTimeDesc+",'%Y-%m-%d') "+_tbTimeDesc+", "+
					_selectParam+
					" from (" +
					mergeTable+
					") as "+_mergeTableAlias+" group by DATE_FORMAT("+_mergeTableAlias+"."+_tbTimeDesc+",'%Y-%m-%d %H'),"+strDuration+";";				
				}
			);			
		}
	}
}

var getRportform_IpPort_Type_Ver_IDC = function (arg0,arg1,arg2,arg3,arg4,arg5,arg6 )
{	
	var _tableName = arguments[0];//��ݷֱ��б�
	var _tableAlias = arguments[1];//��ݷֱ�����б�
	var _condition = arguments[2];//where �����ж�
	var _selectParam = arguments[3];//����ʱ���ѯ���ֶ�����
	var _tbTimeDesc	 = arguments[4];//ʱ���ѯ���ֶ�����
	var callback = arguments[5];
	
	logs.logger.info("arguments:"+JSON.stringify(arguments));
	if(!_condition){callback("");}
  
	var fromDate,toDate,asDay,strSqlType ,sql, sql_para="",sql_para2="",unit_time ="",strDuration,table_version = "",table_p2p = "" ,table_collect = "";
	
	if( _condition.hasOwnProperty("_fromDate") )
	{
		fromDate = new Date( _condition._fromDate );
	}
	
	if(fromDate == null){
		logs.logger.error("error not fromDate!");
		callback("");
	}
  
	if( _condition.hasOwnProperty("_toDate") )
	{
		toDate = new Date( _condition._toDate );
	}
	
	if(toDate == null){
		logs.logger.error("error not toDate!");
		callback( "");
	}
	
	if( _condition.hasOwnProperty("_asDay"))
	{
		asDay = !_condition._asDay || _condition._asDay == "day";
	}
	if( _condition.hasOwnProperty("table_p2p_web") ){
		if ( _condition.table_p2p_web && _condition.table_p2p_web.length == 2  && Number(_condition.table_p2p_web[0]) != -1) {		
			strSqlType = util.format(" and "+"methods=%d ", _condition.table_p2p_web[0]);
			table_p2p = table_p2p + strSqlType;
		}else{
			logs.logger.error("platid error!");	
		}
	}
	if( _condition.hasOwnProperty("table_p2p_utp") ){
		if ( _condition.table_p2p_utp && _condition.table_p2p_utp.length == 2  && Number(_condition.table_p2p_utp[0]) != -1) {		
			strSqlType = util.format(" and "+"methods=%d ", _condition.table_p2p_utp[0]);
			table_p2p = table_p2p + strSqlType;
		}else{
			logs.logger.error("platid error!");	
		}
	}

	if(_condition.hasOwnProperty("table_termid")) {
		if ( _condition.table_termid && _condition.table_termid.length==2 )
		{
			strSqlType = util.format(" and "+"termid in\(0,1,2,3,4 \)");
			sql_para2 = sql_para2 + strSqlType;
		
			strDuration = "termid";
		}else{
			server.logger.error("termType error!");	
		}
	}
	if(_condition.hasOwnProperty("table_webp2p")) {
		if ( _condition.table_webp2p && _condition.table_webp2p.length==2 ) {
			strSqlType = util.format(" and "+"version in \( 50, 9, 56, 18 \) ");
			sql_para2 = sql_para2 + strSqlType ;
			
			strDuration = "version";
		}else 
		{
			server.logger.error("table_webp2p error!");	
		}
	}
	if( _condition.hasOwnProperty("table_termid") || _condition.hasOwnProperty("table_webp2p")){		
		var fromDateFMT = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + fromDate.getDate();
		var toDateFMT = toDate.getFullYear() + "-" + (toDate.getMonth() + 1) + "-" + (toDate.getDate()+1);
		var diffDay = (toDate - fromDate) / (24 * 3600000);
		
		select_ten_minute = "concat( (select date(time_stamp)),' ' , (select hour (time_stamp)),':',(select floor((select minute(time_stamp))/10))*10 ) ,'%Y-%m-%d %H:%i')show_time_segment ";
		if(toDate.getMonth() != fromDate.getMonth())
		{
			for( var i=0;i<Number(diffDay-toDate.getDate()+1);i++)
			{
				var start_time = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + (fromDate.getDate()+i)+" 20";
				var end_time = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + (fromDate.getDate()+i)+" 23";
				unit_time = util.format(" %s.%s >= date_format('%s','%%Y-%%m-%%d %H') and %s.%s <= date_format('%s','%%Y-%%m-%%d %H')",
								_tbTimeDesc,start_time,_tbTimeDesc,end_time); 
				if(i != 0)
				{
					sql_para = sql_para+" or "+unit_time ;
				}
				else {
					sql_para = sql_para+unit_time ;
				}
			}
			for(var j=1;j<toDate.getDate();j++)
			{
				var start_time = toDate.getFullYear() + "-" + (toDate.getMonth() + 1) + "-" +j+" 20";
				var end_time = toDate.getFullYear() + "-" + (toDate.getMonth() + 1) + "-" + j +" 23";
				unit_time = util.format(" %s >= date_format('%s','%%Y-%%m-%%d %H') and %s <= date_format('%s','%%Y-%%m-%%d %H')",
								_tbTimeDesc,start_time,_tbTimeDesc,end_time); 
				if(j != 0)
				{
					sql_para = sql_para+" or "+unit_time ;
				}
				else {
					sql_para = sql_para+unit_time ;
				}
			}
		}
		else {
			for( var i=0;i<diffDay+1;i++)
			{
				var start_time = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + (fromDate.getDate()+i)+" 20";
				var end_time = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + (fromDate.getDate()+i)+" 23";
				unit_time = util.format(" %s >= date_format('%s','%%Y-%%m-%%d %H') and %s <= date_format('%s','%%Y-%%m-%%d %H')",
								_tbTimeDesc,start_time,_tbTimeDesc,end_time); 
				if(i != 0)
				{
					sql_para = sql_para+" or "+unit_time ;
				}
				else {
					sql_para = sql_para+unit_time ;
				}
			}
		}
		date_time =  util.format("( time_stamp >= date_format(' %s %s:00:00 ', '%%Y-%%m-%%d %%H:%%i:%%s') and time_stamp <= date_format('%s %s:%s:00','%%Y-%%m-%%d %%H:%%i:%%s') ) ",fromDateFMT,fromHour,toDateFMT,toHour,toMinute);
		sql = "select DATE_FORMAT("+select_ten_minute+" , "+_selectParam +" from "+_tableName+ " where "+date_time+ sql_para2+ " group by show_time_segment ,"+strDuration;
		callback(sql);
	}

	if( _condition.hasOwnProperty("table_p2p_all")||  _condition.hasOwnProperty("table_p2p_web") ||  _condition.hasOwnProperty("table_p2p_cde")) {			
		var fromDateFMT = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + fromDate.getDate();
		var toDateFMT = toDate.getFullYear() + "-" + (toDate.getMonth() + 1) + "-" + (toDate.getDate()+1);
		var diffDay = (toDate - fromDate) / (24 * 3600000);
		select_ten_minute = "concat( (select date(time_stamp)),' ' , (select hour (time_stamp)),':',(select floor((select minute(time_stamp))/10))*10 ) ,'%Y-%m-%d %H:%i')show_time_segment ";
		for( var i=0;i<diffDay+1;i++)
		{
			var start_time = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + (fromDate.getDate()+i)+" 20";
			var end_time = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + (fromDate.getDate()+i)+" 23";
			
			unit_time = util.format(" %s >= date_format('%s','%%Y-%%m-%%d %H') and %s <= date_format('%s','%%Y-%%m-%%d %H')",
							_tbTimeDesc,start_time,_tbTimeDesc,end_time); 
			if(i != 0)
			{
				sql_para = sql_para+" or "+unit_time ;
			}
			else {
				sql_para = sql_para+unit_time ;
			}
		}
	

		sql = "select DATE_FORMAT("+select_ten_minute+" , "+_selectParam +" from "+_tableName+ " where "+date_time+ table_p2p+ " group by show_time_segment ;";
		
		callback(sql);				
	}
}
*/

exports.queryServerIPList = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		selectIdc(thisObj,res); 
	}else{
    res.result = "expired";
    thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

var select_version = function(callback)
{
	var sql = "select id , ver_name ,ver_del from version_type where ver_del=0 ";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res_ver.result = "zero"; 
				if(callback){
					callback("zero");
				}
			}else{
				var i = 0;
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['ver_del']) ){        			
						res_ver.data[i++] = [_value['id'], _value['ver_name']];
						
					}
					
				});
				if(callback){
					callback(res_ver);
				}
			}
		}
		else{
			if(callback){
				callback("error");
			}
		}
	});
};

exports.queryAddVersion = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var versionId = args["versionId"];
		logs.logger.info("sql:"+versionId);
		var sql ="select ver_name ,ver_del from version_type where ver_name='"+versionId+"'";
		var beginQueryTime = new Date().getTime();
		db.query(sql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) {
				if( rows.length>=1 ){
					if( rows[0]['ver_del'] == 1)
					{
						var ver_sql = "update version_type set ver_del = 0 where ver_name='"+versionId+"'";
						logs.logger.info("update"+sql);
						db.query(ver_sql,function(err) {
							if(!err)
							{
								selectVersion(thisObj,res);
								logs.logger.info("selectVersion");
							}
							else{
								res.result = "error";
								thisObj.responseDirect(200, "text/json", JSON.stringify(res));
							}
						});
					}
					else {
						selectVersion(thisObj,res);
						//thisObj.responseDirect(200, "text/json", JSON.stringify(res));  
						return;
					}  	 			

				}
				else{
					sql = "insert into version_type set ver_name='"+versionId+"'";
					logs.logger.info("sql:"+sql);
					db.query(sql, function(err, rows) {
						if (!err) 
						{
							selectVersion(thisObj,res);
							logs.logger.info("selectVersion");
							//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
						}else{
							res.result = "error";
							thisObj.responseDirect(200, "text/json", JSON.stringify(res));
						}
					});
				}
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});	  
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryDelVersion = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var versionId = Number(args["versionId"]);
		if( isNaN(versionId) ){
			res.result = "error";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			return;
		}
		var sql = "update version_type set  ver_del=1 where id="+versionId;
		//var sql = "delete from version_type where id="+versionId;
		logs.logger.info("sql:"+sql);
		db.query(sql, function(err, rows) {
			if (!err) {
				selectVersion(thisObj,res);
				//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}


exports.queryAddGroup = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var groupId = args["groupId"];
		logs.logger.info("sql:"+groupId);
		var sql ="select g_name ,g_del from group_table where g_name='"+groupId+"'";
		var beginQueryTime = new Date().getTime();
		db.query(sql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) {
				if( rows.length>=1 ){
					if( rows[0]['g_del'] == 1)
					{
						var groupid_sql = "update group_table set g_del = 0 where g_name='"+groupId+"'";
						logs.logger.info("update"+sql);
						db.query(groupid_sql,function(err) {
							if(!err)
							{
								selectGroupid(thisObj,res);
								logs.logger.info("selectGroupid");
							}
							else{
								res.result = "error";
								thisObj.responseDirect(200, "text/json", JSON.stringify(res));
							}
						});
					}
					else {
						selectGroupid(thisObj,res);
						//thisObj.responseDirect(200, "text/json", JSON.stringify(res));  
						return;
					}  	 			

				}
				else{
					sql = "insert into group_table set g_name='"+groupId+"'";
					logs.logger.info("sql:"+sql);
					db.query(sql, function(err, rows) {
						if (!err) 
						{
							selectGroupid(thisObj,res);
							logs.logger.info("selectGroupId");
							//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
						}else{
							res.result = "error";
							thisObj.responseDirect(200, "text/json", JSON.stringify(res));
						}
					});
				}
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});	  
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryAddStream = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var streamId = args["streamId"];
		logs.logger.info("sql:"+streamId);
		var sql ="select s_name ,s_del from stream_table where s_name='"+streamId+"'";
		var beginQueryTime = new Date().getTime();
		db.query(sql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) {
				if( rows.length>=1 ){
					if( rows[0]['s_del'] == 1)
					{
						var streamid_sql = "update stream_table set s_del = 0 where s_name='"+streamId+"'";
						logs.logger.info("update"+sql);
						db.query(streamid_sql,function(err) {
							if(!err)
							{
								selectStreamid(thisObj,res);
								logs.logger.info("selectStreamid");
							}
							else{
								res.result = "error";
								thisObj.responseDirect(200, "text/json", JSON.stringify(res));
							}
						});
					}
					else {
						selectStreamid(thisObj,res);
						//thisObj.responseDirect(200, "text/json", JSON.stringify(res));  
						return;
					}  	 			

				}
				else{
					sql = "insert into stream_table set s_name='"+streamId+"'";
					logs.logger.info("sql:"+sql);
					db.query(sql, function(err, rows) {
						if (!err) 
						{
							selectStreamid(thisObj,res);
							logs.logger.info("selectStreamId");
							//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
						}else{
							res.result = "error";
							thisObj.responseDirect(200, "text/json", JSON.stringify(res));
						}
					});
				}
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});	  
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryAddUpgrade = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var upgradeId = args["upgradeId"];
		logs.logger.info("sql:"+upgradeId);
		var sql ="select a_name ,a_del from aid_table where a_name='"+upgradeId+"'";
		var beginQueryTime = new Date().getTime();
		db.query(sql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) {
				if( rows.length>=1 ){
					if( rows[0]['a_del'] == 1)
					{
						var upgradeid_sql = "update aid_table set a_del = 0 where a_name='"+upgradeId+"'";
						logs.logger.info("update"+sql);
						db.query(upgradeid_sql,function(err) {
							if(!err)
							{
								selectserUpgradeid(thisObj,res);
								logs.logger.info("selectUpgradeid");
							}
							else{
								res.result = "error";
								thisObj.responseDirect(200, "text/json", JSON.stringify(res));
							}
						});
					}
					else {
						selectserUpgradeid(thisObj,res);
						//thisObj.responseDirect(200, "text/json", JSON.stringify(res));  
						return;
					}  	 			

				}
				else{
					sql = "insert into aid_table set a_name='"+upgradeId+"'";
					logs.logger.info("sql:"+sql);
					db.query(sql, function(err, rows) {
						if (!err) 
						{
							selectserUpgradeid(thisObj,res);
							logs.logger.info("selectserUpgradeid");        	
						}else{
							res.result = "error";
							thisObj.responseDirect(200, "text/json", JSON.stringify(res));
						}
					});
				}
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});	  
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryDelGroup = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var groupId = Number(args["groupId"]);
		if( isNaN(groupId) ){
			res.result = "error";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			return;
		}
		var sql = "update group_table set  g_del=1 where id="+groupId;
		//var sql = "delete from version_type where id="+groupId;
		logs.logger.info("sql:"+sql);
		db.query(sql, function(err, rows) {
			if (!err) {
				selectGroupid(thisObj,res);
				//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryDelStream = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var streamId = Number(args["streamId"]);
		if( isNaN(streamId) ){
			res.result = "error";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			return;
		}
		var sql = "update stream_table set  s_del=1 where id="+streamId;
		//var sql = "delete from version_type where id="+streamId;
		logs.logger.info("sql:"+sql);
		db.query(sql, function(err, rows) {
			if (!err) {
				selectStreamid(thisObj,res);
				//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}
exports.queryDelUpgrade = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var upgradeId = Number(args["upgradeId"]);
		if( isNaN(upgradeId) ){
			res.result = "error";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			return;
		}
		var sql = "update aid_table set a_del=1 where id="+upgradeId;
		//var sql = "delete from version_type where id="+streamId;
		logs.logger.info("sql:"+sql);
		db.query(sql, function(err, rows) {
			if (!err) {
				selectserUpgradeid(thisObj,res);
				//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});
	}
	else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

var selectGather = function(thisObj,res) {
	var sql = "select rtmfpTB.id ,rtmfpTB.ser_ip , rtmfpTB.ser_port ,rtmfpTB.idc, sum(rtmfpTB.rtmfp_online) online  from server_data_rtmfp as rtmfpTB  group by ser_ip"//"select ser_ip , ser_port ,idc, sum(rtmfp_online) from server_data_rtmfp group by ser_ip";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {	
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err){
    	 	if (!rows.length) {
				res.result = "zero";
			}
			else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {     
					logs.logger.info("online:"+_value['online']);
					res.data[i++] = [_value['ser_ip'], _value['ser_port'],_value['idc'],_value['online']];
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};

exports.queryCDE = function(args) {
	var thisObj = this;
	var res = {};
	var CDE_idc;
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var overLoadData = server.get_timely_overload_data();
		if(overLoadData && overLoadData.length>0){
			for(var key in overLoadData[overLoadData.length-1])
			{
				if(overLoadData[overLoadData.length-1][key].idc == 0)
				{
					CDE_idc = "电信";
				}
				else if(overLoadData[overLoadData.length-1][key].idc == 1)
				{
					CDE_idc = "联通";	
				}
				else
				{
					CDE_idc = "其他";	
				}
				if(overLoadData[overLoadData.length-1][key].ser_ip != null && overLoadData[overLoadData.length-1][key].ser_port != null)
				{
					res.data.push([overLoadData[overLoadData.length-1][key].ser_ip, overLoadData[overLoadData.length-1][key].ser_port, CDE_idc, (overLoadData[overLoadData.length-1][key].cde || 0)]);
				}
			}
		}
  		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryRtmfp = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var overLoadData = server.get_timely_overload_data();
		if(overLoadData && overLoadData.length>0){
			for(var key in overLoadData[overLoadData.length-1])
			{
				if(overLoadData[overLoadData.length-1][key].idc == 0)
				{
					rtmfp_idc = "电信";
				}
				if(overLoadData[overLoadData.length-1][key].idc == 1)
				{
					rtmfp_idc = "联通";
				}
				else
				{
					rtmfp_idc = "其他";
				}
				if(overLoadData[overLoadData.length-1][key].ser_ip != null && overLoadData[overLoadData.length-1][key].ser_port != null)
				{
					res.data.push([overLoadData[overLoadData.length-1][key].ser_ip, overLoadData[overLoadData.length-1][key].ser_port, rtmfp_idc, (overLoadData[overLoadData.length-1][key].rtmfp||0)]);
				}
			}
		}
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}


var selectVersion = function(thisObj,res)
{
	var sql = "select id , ver_name ,ver_del from version_type";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['ver_del']) ){        			
						res.data[i++] = [_value['id'], _value['ver_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};

exports.queryServerVersionList = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		selectVersion(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

var selectGroupid = function(thisObj,res)
{
	var sql = "select id , g_name ,g_del from group_table";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['g_del']) ){        			
						res.data[i++] = [_value['id'], _value['g_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};

var selectStreamid = function(thisObj,res)
{
	var sql = "select id , s_name ,s_del from stream_table";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['s_del']) ){        			
						res.data[i++] = [_value['id'], _value['s_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};
/*
var selectlocUpgradeid = function(thisObj,res)
{
	var sql = "select id , p_name ,p_del from pid_table";
		db.query(sql, function(err, rows) {
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['p_del']) ){        			
						res.data[i++] = [_value['id'], _value['p_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};
*/
var selectserUpgradeid = function(thisObj,res)
{
	var sql = "select id , a_name ,a_del from aid_table";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['a_del']) ){        			
						res.data[i++] = [_value['id'], _value['a_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};

exports.queryServerGroupList = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		selectGroupid(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryServerStreamList = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		selectStreamid(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryupgradeversion = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		upgradeversion(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

var upgradeversion = function(thisObj,res)
{
	var sql = "select id , a_name ,a_del from aid_table";
	var beginQueryTime = new Date().getTime();
	db.query(sql, function(err, rows) {
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['a_del']) ){        			
						res.data[i++] = [_value['id'], _value['a_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};


exports.queryupgrademodel = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		upgrademodel(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}
var upgrademodel = function(thisObj,res)
{
	var sql = "select id , m_name ,m_del from mid_table";
		db.query(sql, function(err, rows) {
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['m_del']) ){        			
						res.data[i++] = [_value['id'], _value['m_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};


exports.queryupgradevendor = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		upgradevendor(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}
var upgradevendor = function(thisObj,res)
{
	var sql = "select id , v_name ,v_del from vid_table";
		db.query(sql, function(err, rows) {
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['v_del']) ){        			
						res.data[i++] = [_value['id'], _value['v_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};


exports.queryupgraderomversion = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		upgraderomversion(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}
var upgraderomversion = function(thisObj,res)
{
	var sql = "select id , r_name ,r_del from rid_table";
		db.query(sql, function(err, rows) {
    	if (!err) 
    	{
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				//res.data[i++] = ['0', "other"];
				rows.forEach(function( _value ) {
					if( 0 == Number(_value['r_del']) ){        			
						res.data[i++] = [_value['id'], _value['r_name']];
					}
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}
		else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};

exports.queryAddIdc = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {//sess
		var idcId = args["idcId"];
		var idcType=Number(args["idcType"]);
		logs.logger.info("sql:"+idcId);
		var sql ="select idc_name from idc_type where idc_name='"+idcId+"'";
		db.query(sql, function(err, rows) {
			if (!err){
				if( rows.length>=1 ){
					selectIdc(thisObj,res);
					//thisObj.responseDirect(200, "text/json", JSON.stringify(res));  
					return;
				}else{
					//sql = "insert into server_info set ip_port='"+idcId+"'";
					sql = "insert into idc_type (idc_name,ind) values('"+idcId+"','"+idcType+"')";
					logs.logger.info("sql:"+sql);
					db.query(sql, function(err, rows) {
						if (!err) 
						{
							selectIdc(thisObj,res);
							logs.logger.info("selectIdc");
							//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
						}else{
							res.result = "error";
							thisObj.responseDirect(200, "text/json", JSON.stringify(res));
						}
					});
				}
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});	  
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

exports.queryDelIdc = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var idcId = Number(args["idcId"]);
		if( isNaN(idcId) )
		{
			res.result = "error";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			return;
		}
		//var sql = "update server_info set  ser_del=1 where id="+idcId;
		var sql = "delete from idc_type where id="+idcId;
		logs.logger.info("sql:"+sql);
		db.query(sql, function(err, rows) {
			if (!err) 
			{
				selectIdc(thisObj,res);
			//thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
			}else{
				res.result = "error";
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			}
		});
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}

var selectIdc = function(thisObj,res)
{
	var sql = "select id , idc_name ,ind from idc_type";
	var beginQueryTime = new Date().getTime();
  	db.query(sql, function(err, rows) {
	res.queryTime = new Date().getTime() - beginQueryTime;
    	if (!err){
    	 	if (!rows.length) {
				res.result = "zero";
			}else{
				var i = 0;
				rows.forEach(function( _value ) {     			
					res.data[i++] = [_value['id'], _value['idc_name'],_value['ind']];
				});
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));        	
		}else{
			res.result = "expired";
    		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	});	
};

exports.queryServerIdcList = function(args) {
	var thisObj = this;
	var res = {};
	res.data = new Array();;
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		selectIdc(thisObj,res);
	}else {
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}


function summaryInfoCons(iOne, iTwo, iThree, iFour) 
{
    this.pdRatio_tr = iOne;
    this.coRatio_tr = iTwo;
    this.onUsers_tr = iThree;
    this.cuUsers_tr = iFour; 
}

exports.querySummaryInfoData = function() 
{
	var thisObj = this;
	var res = {};
	res.result = "success";
	res.data = new Array();
	var sess = validate(this.req);
	if( sess )
	{
		var shareRateData = server.get_timely_data();
		var overLoadData = server.get_timely_overload_data();
		//var rtmfpData = server.get_timely_rtmfp_data();

	//	console.log("shareRateData: "+JSON.stringify(shareRateData));
	//	console.log(Number(shareRateData[0]['cdn_size']));
		
		var allSize = 0;
		var cdnSize = 0;
		var rtmfp = 0;
		var cde = 0;
		if( shareRateData.length==0 ){
    		summaryInfoObj = new summaryInfoCons(0,0,0,0);
  			res.data = summaryInfoObj;
			thisObj.responseDirect(200, 'text/json', JSON.stringify(res));
			return;
		}
		
		allSize = Number(shareRateData[0]['cdn_size'])+Number(shareRateData[0]['p2p_pc_size'])+Number(shareRateData[0]['p2p_tv_size'])+
		Number(shareRateData[0]['p2p_box_size'])+Number(shareRateData[0]['p2p_mo_size'])+Number(shareRateData[0]['cde_pc_size'])+
		Number(shareRateData[0]['cde_tv_size'])+Number(shareRateData[0]['cde_box_size'])+Number(shareRateData[0]['cde_mo_size'])+
		Number(shareRateData[0]['lsize_cde']);
		//rtmfp = 2000;
	//	cde = 500;
	//	cdeSize = 5000;
		cdnSize = Number(shareRateData[0]['cdn_size']);
		rtmfp =  (Number(overLoadData[0]['rtmfp_total'])||0) ;
		cde = (overLoadData[0]['cde_total']||0);
		summaryInfoObj = new summaryInfoCons(
			//( allSize == 0?0:((allSize-cdnSize)/allSize).toFixed(2) ),
			(((allSize-cdnSize)/(1024*1024*1024))/(allSize/(1024*1024*1024))).toFixed(4),
			0,
			cde,
			rtmfp
		);
		res.data = summaryInfoObj;
		thisObj.responseDirect(200, 'text/json', JSON.stringify(res));
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};



exports.queryRecentAllInfo = function(args) 
{
	var thisObj = this;
	var res = {};
	res.result = "success";
	res.data = { 'cdeusers': [], 'rtmfpusers': [], 'ptopdownload': [], 'connectivity': [] };
  
	var sess = validate(this.req);
	if (sess) 
	{
		var recentInfoObj = { 'cdeusers': [], 'rtmfpusers': [], 'ptopdownload': [], 'connectivity': [] };
		recentInfoObj.connectivity = [];
		var shareRateData = server.get_timely_data();
		var overLoadData = server.get_timely_overload_data();
		//var rtmfpData = server.get_timely_rtmfp_data();
		//console.log("shareRateData: "+JSON.stringify(shareRateData));
		
		var allSize = 0;
		var cdnSize = 0;
		var rtmfp = 0;
		var cde = 0;
		if( shareRateData.length==0 ){
    		res.data = recentInfoObj;
			thisObj.responseDirect(200, 'text/json', JSON.stringify(res));
			return;
		}
		for( var shareRateDataID = 0; shareRateDataID < shareRateData.length ;shareRateDataID++ ){
			if(shareRateDataID<overLoadData.length ){
				rtmfp = Number(overLoadData[shareRateDataID]['rtmfp_total'] ||0);
				cde = Number(overLoadData[shareRateDataID]['cde_total']||0);
				if( isNaN(rtmfp) ){rtmfp = 0;}
				if( isNaN(cde) ){cde = 0;}
				recentInfoObj.cdeusers.push( cde );
				recentInfoObj.rtmfpusers.push(rtmfp);
			}
			
			allSize = Number(shareRateData[shareRateDataID]['cdn_size'])+Number(shareRateData[shareRateDataID]['p2p_pc_size'])+Number(shareRateData[shareRateDataID]['p2p_tv_size'])+
			Number(shareRateData[shareRateDataID]['p2p_box_size'])+Number(shareRateData[shareRateDataID]['p2p_mo_size'])+Number(shareRateData[shareRateDataID]['cde_pc_size'])+
			Number(shareRateData[shareRateDataID]['cde_tv_size'])+Number(shareRateData[shareRateDataID]['cde_box_size'])+Number(shareRateData[shareRateDataID]['cde_mo_size'])+
			Number(shareRateData[shareRateDataID]['lsize_cde']);
			cdnSize = Number(shareRateData[shareRateDataID]['cdn_size']);
			recentInfoObj.ptopdownload.push( (allSize==0?0:(100*(allSize-cdnSize)/allSize).toFixed(2)) );
		}
		res.data = recentInfoObj;
		thisObj.responseDirect(200, 'text/json', JSON.stringify(res));
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	} 
};

exports.query_hisdata_onlineuser = function(args) 
{
	var thisObj = this;
  //var client = dbClientG;
  var res = {};
  res.data = new Array();
  res.result = "success";
  var sess = validate(this.req);
  if (sess) 
  {
  	var _tableName = arguments[0];//��ݷֱ��б�
	var _tableAlias = arguments[1];//��ݷֱ�����б�
	var _condition = arguments[2];//where �����ж�
	var _selectParam = arguments[3];//����ʱ���ѯ���ֶ�����
 	 var _tbTimeDesc	 = arguments[4];//����ʱ���ѯ���ֶ�����
  	var sql = getSqlStatementBy_IpPort_Type_Ver_IDC (
  	TABLE_RTMFP_SERVERDATA,//��ݱ���
		"T_A",//��ݱ����
		{
			"_asDay":args["type"],//�Ƿ������,��������
			"_toDate":args["to"],//����ʱ��,��������
			"_fromDate":args["from"],//��ʼʱ��,��������
			"ip":[args["ip"],"ser_ip"],//ip
		//	"port":[args["port"],"ser_port"],//�˿�
			"idc":[args["idcVar"],"idc"]//,//��Ӫ��
			//"playType":["version",args["idcVar"]],//����������
			//"version":["version",args["idcVar"]],//�汾
			//"termType":["version",args["idcVar"]],//�ն�����
		},//where �����ж�
		"sum(rtmfp) rtmfp ",//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
  	
		var beginQueryTime = new Date().getTime();
		db.query(sql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
    	 if (!err) 
    	 {
	    	 	if (!rows.length) {
	            res.result = "zero";
	        }
	        else 
	        {
	        	var i = 0;
				rows.forEach(function(val) {
				var index = i;
				i++;
				var strDateTime = (val['show_time_segment']);
				var strDateOnly = strDateTime.substr(0, 10);
				var strHour;
                if (strDateTime.length > 10){
                    strHour = strDateTime.substr(11, 2);
                }else{
                  strHour = '-';
                }
                 var val_usrAll = Math.round(val['rtmfp']) ;
                 res.data[index] = [strDateOnly, strHour, val_usrAll];
	            });	            
	        }
    	 }else{
    	 	logs.logger.error("query hisdata_onlineuser: "+err);
    	 	res.result = "failed";
    	 }
    	 //logs.logger.info("result:"+JSON.stringify( res ));
    	 thisObj.responseDirect(200, "text/json", JSON.stringify(res));
    });
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

//node distribute
//{"data":[["2014-04-07 00:34:26","2%","36%","7%","5%","4%","3%","3%","4%","37%","27793648"],["2014-04-07 01:34:26","2%","38%","7%","5%","4%","3%","3%","3%","34%","18894498"],["2014-04-07 02:34:26","2%","40%","8%","5%","4%","3%","3%","3%","31%","13539037"],["2014-04-07 03:34:26","2%","40%","8%","6%","4%","3%","3%","3%","30%","10524692"],["2014-04-07 04:34:26","3%","40%","8%","6%","4%","4%","3%","3%","30%","9012611"],["2014-04-07 05:34:26","3%","39%","9%","6%","4%","4%","3%","3%","29%","8325665"],["2014-04-07 06:34:26","3%","40%","9%","6%","4%","4%","3%","3%","29%","8119280"],["2014-04-07 11:34:26","2%","36%","7%","5%","4%","4%","3%","4%","35%","23835695"],["2014-04-08 12:34:26","2%","35%","6%","5%","4%","4%","4%","4%","37%","30787765"],["2014-04-08 13:34:26","2%","34%","6%","5%","4%","4%","3%","4%","38%","36398856"],["2014-04-08 14:34:26","2%","34%","6%","5%","4%","4%","3%","4%","38%","32869238"],["2014-04-08 15:34:26","2%","34%","6%","5%","4%","4%","3%","4%","38%","31636569"]],"result":"success"}
exports.query_hisdata_nodedistribute = function(args) 
{
	var thisObj = this;
	var res = {};
	res.data =[];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) 
	{
		var tb_prefix = "";
		if(args["agree"] == 0 || args["agree"] == 1 || args["agree"] == 2)
		{
			tb_prefix = "node_distri_";
		}
		else if(args["agree"] == 3 || args["agree"] == 4 || args["agree"] == 5)
		{
			tb_prefix = "lnode_distri_";
		}
		var typ_list = ["vod","liv","dl"];
		var idc_list = ["unicom","telecom","other"];
		var typVar = Number(args["typVar"]);
		var idcVar = Number(args["idcVar"]);
		var useTable = [];
		var useTableAlias = [];
		var selectElement = "";
		
		if( -1 == typVar  && -1 == idcVar )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 0; idcId < idc_list.length; idcId++ )
				{
						useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
						useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if(-2 == idcVar && -1 == typVar)
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 1; idcId <= 2; idcId++ )
				{
					useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if( -2 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 1; idcId <= 2; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		if( -1 == typVar && idcVar >= 0 && idcVar < idc_list.length )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typId+"_"+idcVar);
			}
		}
		
		if( -1 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 0; idcId < idc_list.length; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		//
		if( -1 != typVar && typVar >=0 && -1 != idcVar && idcVar >= 0 )
		{
				useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typVar+"_"+idcVar);
		}
		
		if(useTable.length == 0)
		{
			logs.logger.error("query_hisdata_nodedistribute->tables error")
		}
		
		//logs.logger.info("args:"+JSON.stringify(args)+"\n\n");
		if(args["agree"] == 0 || args["agree"] == 3) {
			selectElement = "sum( node_rep_count) node_rep_count ,sum( no_node_heart) no_node_heart ,sum( forbid_node_heart) forbid_node_heart ,"+
			"sum( zero_node_heart) zero_node_heart ,sum( one_node_heart) one_node_heart ,sum( two_node_heart) two_node_heart ,"+
			"sum( three_node_heart) three_node_heart ,sum( four_node_heart) four_node_heart ,sum( five_node_heart) five_node_heart ,"+
			"sum( six_node_heart) six_node_heart ,sum( other_node_heart) other_node_heart ";
		}
		else if(args["agree"] == 1 || args["agree"] == 4)
		{
			selectElement = "sum( node_rep_count) node_rep_count ,sum( no_cde_heart) no_node_heart ,sum( forbid_cde_heart) forbid_node_heart ,"+
			"sum( zero_cde_heart) zero_node_heart ,sum( one_cde_heart) one_node_heart ,sum( two_cde_heart) two_node_heart ,"+
			"sum( three_cde_heart) three_node_heart ,sum( four_cde_heart) four_node_heart ,sum( five_cde_heart) five_node_heart ,"+
			"sum( six_cde_heart) six_node_heart ,sum( other_cde_heart) other_node_heart ";
		}
		else if(args["agree"] == 2 || args["agree"] == 5)
		{
			selectElement = "sum( node_rep_count) node_rep_count ,sum( no_all_heart) no_node_heart ,"+
			"sum( forbid_all_heart) forbid_node_heart ,sum( zero_all_heart) zero_node_heart,"+
			"sum( one_all_heart) one_node_heart ,sum( two_all_heart) two_node_heart ,"+
			"sum( three_all_heart) three_node_heart ,sum( four_all_heart) four_node_heart ,"+
			"sum( five_all_heart) five_node_heart ,sum( six_all_heart) six_node_heart ,"+
			"sum( other_all_heart) other_node_heart ";
		}
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//别名
		{
			"_asDay":args["type"],//类型（天、小时）
			"_toDate":args["to"],//止于时间
			"_fromDate":args["from"],//起始时间
			"version":[args["verVar"],"version"],//版本
			"gid":[args["gid"],"gid"], //Group ID
			"termType":[args["terminalId"],"termid"],//,平台类型
			"appid":[args["appid"],"appid"], // 应用类型
			"methods":[args["methods"],"methods"], //UTP 或者 WEB
			"p":[args["p"],"p"],  //p=l 私有协议 p=r rtfmp协议
			"sid":[args["sid"],"sid"],  //streamID  一路视频的分享率
			"agree":[args["agree"],"agree"]
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
		
		 logs.logger.info("history node sql:"+mysql);		
		 var beginQueryTime = new Date().getTime();
		db.query(mysql, function(err, rows) {		
		 res.queryTime = new Date().getTime() - beginQueryTime;
    	 if (!err) 
    	 {
			if (!rows.length) {
				res.result = "zero";
	        }
	        else 
	        {
	        	var i = 0;
				rows.forEach(function( _value ) {
				var index = i;
				i++;
				var strDateTime = (_value['show_time_segment']);
				var total = Number(_value['no_node_heart'])+Number(_value['forbid_node_heart'])+Number(_value['zero_node_heart'])+
				Number(_value['one_node_heart'])+Number(_value['two_node_heart'])+Number(_value['three_node_heart'])+
				Number(_value['four_node_heart'])+Number(_value['five_node_heart'])+Number(_value['six_node_heart'])+
				Number(_value['other_node_heart']);
				total = isNaN(total)?0:total;
				var no_node_ratio = total==0?0:(100*Number(_value['no_node_heart'])/total).toFixed(1)+'%';
				var forbid_node_ratio = total==0?0:(100*Number(_value['forbid_node_heart'])/total).toFixed(1)+'%';
				var zero_node_ratio = total==0?0:(100*Number(_value['zero_node_heart'])/total).toFixed(1)+'%';
				var one_node_ratio = total==0?0:(100*Number(_value['one_node_heart'])/total).toFixed(1)+'%';
				var two_node_ratio = total==0?0:(100*Number(_value['two_node_heart'])/total).toFixed(1)+'%';
				var three_node_ratio = total==0?0:(100*Number(_value['three_node_heart'])/total).toFixed(1)+'%';
				var four_node_ratio = total==0?0:(100*Number(_value['four_node_heart'])/total).toFixed(1)+'%';
				var five_node_ratio = total==0?0:(100*Number(_value['five_node_heart'])/total).toFixed(1)+'%';
				var six_node_ratio = total==0?0:(100*Number(_value['six_node_heart'])/total).toFixed(1)+'%';
				var other_node_ratio = total==0?0:(100*Number(_value['other_node_heart'])/total).toFixed(1)+'%';

				//var val_usrAll = Math.round(val['rtmfp_online']) ;
				res.data[index] = [strDateTime, no_node_ratio,forbid_node_ratio, zero_node_ratio,one_node_ratio,two_node_ratio,three_node_ratio,
				four_node_ratio,five_node_ratio,six_node_ratio,other_node_ratio,Number(_value['node_rep_count'])];
				});				
			}
    	 }else{
    	 	logs.logger.error("query hisdata_nodedistribute: "+err);
    	 	res.result = "failed";
    	 }
    	 //logs.logger.info("result:"+JSON.stringify( res ));
    	 thisObj.responseDirect(200, "text/json", JSON.stringify(res));
    });
		
		//thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

//p2p ratio
exports.query_hisdata_ptopratio = function(args) {
  var thisObj = this;
  //var client = dbClientG;
  var res = {};
 
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var tb_prefix = "share_rate_";
		var typ_list = ["vod","liv","dl"];
		var idc_list = ["unicom","telecom","other"];
		var typVar = Number(args["typVar"]);
		var idcVar = Number(args["idcVar"]);
		var useTable = [];
		var useTableAlias = [];
		
		//播放类型全部，运营商全部
		if( -1 == typVar  && -1 == idcVar )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 0; idcId < idc_list.length; idcId++ )
				{
						useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
						useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if(-2 == idcVar && -1 == typVar)
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 1; idcId <= 2; idcId++ )
				{
					useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if( -2 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 1; idcId <= 2; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		//播放类型全部，运营商传过来值
		if( -1 == typVar && idcVar >= 0 && idcVar < idc_list.length )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typId+"_"+idcVar);
			}
		}
		//播放类型传过来，运营商固定
		if( -1 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 0; idcId < idc_list.length; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		//
		if( -1 != typVar && typVar >=0 && -1 != idcVar && idcVar >= 0 )
		{
				useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typVar+"_"+idcVar);
		}
		
		if(useTable.length == 0)
		{
			logs.logger.error("query_hisdata_nodedistribute->tables error")
		}
	
		var selectElement = "sum( cdn_size) cdn_size ,sum( p2p_pc_size) p2p_pc_size ,"+
		"sum( p2p_tv_size) p2p_tv_size, sum( p2p_box_size) p2p_box_size ,"+
		"sum( p2p_mo_size) p2p_mo_size,sum( cde_pc_size) cde_pc_size ,"+
		"sum( cde_tv_size) cde_tv_size, sum( cde_box_size) cde_box_size ,"+
		"sum( cde_mo_size) cde_mo_size, sum( lpsize) lpsize,sum(lcsize) lcsize,sum(lsize_cde) lsize_cde,sum(up_rtmfp) up_rtmfp,sum(up_cde) up_cde,"+
		"sum( conn_node_times) conn_node_times ,sum( get_node_times) get_node_times ,"+
		"sum( conn_cde_times) conn_cde_times ,sum( get_cde_times) get_cde_times ,"+
		"sum( share_rep_count)share_rep_count, sum(act) act";
		
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],//按天查询
			"_toDate":args["to"],//止日期
			"_fromDate":args["from"],//起日期
			"version":[args["verVar"],"version"],//版本类型
			"gid":[args["gid"],"gid"], //Group ID
			"termType":[args["terminalId"],"termid"],//终端类型
			"platid":[args["platid"],"platid"],//平台类型
			"splatid":[args["splatid"],"splatid"],//子平台类型
			"appid":[args["appid"],"appid"], // 应用类型
			"methods":[args["methods"],"methods"], //UTP 或者 WEB
			"p":[args["p"],"p"],   //p=l 私有协议  p=r rtfmp协议
			"sid":[args["sid"],"sid"],  //streamID  一路视频的分享率
			"ch":[args["ch"],"ch"],
			"p1":[args["p1"],"p1"],
			"p2":[args["p2"],"p2"],
			"p3":[args["p3"],"p3"],
			"country":[args["country"],"country"], // 国家
			"province":[args["province"],"province"] //省 
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
		var select_time = 0;
		if(args["type"] == "hour")
		{
			select_time = 3600;
		}
		else {
			select_time = 600;
		}
		var beginQueryTime = new Date().getTime();
		//logs.logger.info("ptoprato sql:"+mysql);
		db.query(mysql, function(err, rows) {		
		 res.queryTime = new Date().getTime() - beginQueryTime;
    	 if (!err) 
    	 {
			if (!rows.length) {
				res.result = "zero";
	        }
	        else 
	        {
	        	var i = 0;	        	
				rows.forEach(function( _value ) {
              	var index = i;
	            	i++;
	            	var strDateTime = (_value['show_time_segment']);  // if every hour ,then show_time_segment hour; if every 10 minute ,then show_time_segment ten minute
	            	var rep_count = Number(_value['share_rep_count'])||0;
	            	var cdn = isNaN(Number(_value['cdn_size']))?0:Number(_value['cdn_size']);
					var pc = isNaN(Number(_value['p2p_pc_size']))?0:Number(_value['p2p_pc_size']);
					var tv = isNaN(Number(_value['p2p_tv_size']))?0:Number(_value['p2p_tv_size']);
					var box = isNaN(Number(_value['p2p_box_size']))?0:Number(_value['p2p_box_size']);
					var mb = isNaN(Number(_value['p2p_mo_size']))?0:Number(_value['p2p_mo_size']);
					var cde_pc = isNaN(Number(_value['cde_pc_size']))?0:Number(_value['cde_pc_size']);
					var cde_tv = isNaN(Number(_value['cde_tv_size']))?0:Number(_value['cde_tv_size']);
					var cde_box = isNaN(Number(_value['cde_box_size']))?0:Number(_value['cde_box_size']);
					var cde_mb = isNaN(Number(_value['cde_mo_size']))?0:Number(_value['cde_mo_size']);
					var lp = isNaN(Number(_value['lpsize']))?0:Number(_value['lpsize']);				
					var lc = isNaN(Number(_value['lcsize']))?0:Number(_value['lcsize']);				
					var lsize_cde = isNaN(Number(_value['lsize_cde']))?0:Number(_value['lsize_cde']);
					var up_rtmfp = isNaN(Number(_value['up_rtmfp']))?0:Number(_value['up_rtmfp']);
					var up_cde = isNaN(Number(_value['up_cde']))?0:Number(_value['up_cde']);
					var act = isNaN(Number(_value['act']))?0:Number(_value['act']);
					var allSize = cdn + pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb + lsize_cde;
					var cdnBandwidth = cdn*8/(1024 * 1024 * 1024*select_time);
					var saveBandwidth = (allSize - cdn)*8/(1024 * 1024 * 1024*select_time);
					var online_people = (rep_count/select_time*60).toFixed(0);
					var video_rate = allSize*8*1024*1024/rep_count/60;  //allSize*8 *1024*1024/时间/在线人数
					
					 res.data[index] = [strDateTime,
					 (allSize/(1024 * 1024 * 1024)).toFixed(1),
					 (cdn/(1024 * 1024 * 1024)).toFixed(1),
					 (pc/(1024 * 1024 * 1024)).toFixed(1),								 
					 (tv/(1024 * 1024 * 1024)).toFixed(1),
					 (box/(1024 * 1024 * 1024)).toFixed(1),
					 (mb/(1024 * 1024 * 1024)).toFixed(1),
					 (cde_pc/(1024 * 1024 * 1024)).toFixed(1),								 
					 (cde_tv/(1024 * 1024 * 1024)).toFixed(1),
					 (cde_box/(1024 * 1024 * 1024)).toFixed(1),
					 (cde_mb/(1024 * 1024 * 1024)).toFixed(1),
					 /*
					 allSize,
					 cdn,
					 pc,
					 tv,
					 box,
					 mb,
					 cde_pc,
					 cde_tv,
					 cde_box,
					 cde_mb,
					 */
					 (lp/(1024 * 1024 * 1024)).toFixed(1),
					 (lc/(1024 * 1024 * 1024)).toFixed(1),
					 (lsize_cde/(1024 * 1024 * 1024)).toFixed(1),
					 (up_rtmfp/(1024 * 1024 * 1024)).toFixed(1),
					 (up_cde/(1024 * 1024 * 1024)).toFixed(1),
					  rep_count ? Number(_value['conn_node_times']/(rep_count)).toFixed(1) : 0,
					  rep_count ? Number(_value['get_node_times']/(rep_count)).toFixed(1) : 0,
					  rep_count ? Number(_value['conn_cde_times']/(rep_count)).toFixed(1) : 0,
					  rep_count ? Number(_value['get_cde_times']/(rep_count)).toFixed(1) : 0,
					 cdnBandwidth.toFixed(2),
					 saveBandwidth.toFixed(2),
					 (cdnBandwidth*1.488).toFixed(2),
					 (saveBandwidth*1.488).toFixed(2),
					 (allSize==0?0:(100 * (allSize - cdn)/ allSize).toFixed(2)) + '%',												//p2p分享率
					 online_people,																									//在线人数
					 act,
					 (video_rate/1024/1024/1024).toFixed(0),																			//平均码率
					 act==0?0.0:((rep_count/act).toFixed(1)),																			//时长
					 (((pc+cde_pc)/(pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb+lsize_cde)*100).toFixed(1))+'%',                    //pc贡献比
					 (((cde_pc+cde_tv+cde_box+cde_mb+lsize_cde)/(pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb+lsize_cde)*100).toFixed(1))+'%'  //websocket贡献比
					 ]
	            });
	        }
    	 }else{
    	 	logs.logger.error("query hisdata_ptopratio: "+err);
    	 	res.result = "failed";
    	 }
    //	 logs.logger.info("result: research ptopratio successfully! ");
    	// logs.logger.info("result: "+JSON.stringify(res) );
    	 thisObj.responseDirect(200, "text/json", JSON.stringify(res));
    });
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

//{"data":[["2014-04-07 00:34:26","26.1",3198064,"100%","2.44","99%","14.15","97%","19.48","96%","12.85","49%","468.84"],["2014-04-07 14:34:26","22.5",4378823,"97%","1.36","97%","11.75","95%","31.54","95%","10.53","52%","288.37"],["2014-04-08 15:34:26","22.7",4179932,"98%","1.39","98%","12.63","96%","31.07","95%","10.68","52%","284.45"]],"result":"success"}
exports.query_hisdata_stagequality = function(args) {
	var thisObj = this;
	var res = {};
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var tb_prefix = "stage_quality_";
		var typ_list = ["vod","liv","dl"];
		var idc_list = ["unicom","telecom","other"];
		var typVar = Number(args["typVar"]);
		var idcVar = -1;//Number(args["idcVar"]);
		var useTable = [];
		var useTableAlias = [];
				
		if( -1 == typVar  && -1 == idcVar )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 0; idcId < idc_list.length; idcId++ )
				{
					useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		
		if( -1 == typVar && idcVar >= 0 && idcVar < idc_list.length )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typId+"_"+idcVar);
			}
		}
		if(-2 == idcVar && -1 == typVar)
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 0; idcId < 2; idcId++ )
				{
					useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if( -2 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 0; idcId < 2; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		if( -1 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 0; idcId < idc_list.length; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		//
		if( -1 != typVar && typVar >=0 && -1 != idcVar && idcVar >= 0 )
		{
				useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typVar+"_"+idcVar);
		}
		
		if(useTable.length == 0)
		{
			logs.logger.error("query_hisdata_nodedistribute->tables error")
		}
  	
		var selectElement = "sum( stage_rep_count) stage_rep_count ,sum( act_rep_zero) act_rep_zero ,"+
		"sum( act_rep_one) act_rep_one ,sum( act_rep_two) act_rep_two ,"+
		"sum( act_rep_three) act_rep_three ,sum( act_rep_four) act_rep_four ,"+
		"sum( act_rep_five) act_rep_five ,sum( act_rep_eight) act_rep_eight,"+
		"sum( act_rep_eleven) act_rep_eleven, sum( act_rep_twelve) act_rep_twelve,"+
		"sum( act_success_one) act_success_one ,sum( act_time_one) act_time_one ,"+
		"sum( act_time_two) act_time_two ,sum( act_time_three) act_time_three ,"+
		"sum( act_time_four) act_time_four ,sum( act_time_five) act_time_five ,"+
		"sum( act_time_eight) act_time_eight,sum( act_time_eleven) act_time_eleven,"+
		"sum( act_time_twelve) act_time_twelve,sum(size1) size1 ,sum(size2) size2";
				
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],//按天查询
			"_toDate":args["to"],//止日期
			"_fromDate":args["from"],//起日期
			"version":[args["verVar"],"version"],//版本类型
			"gid":[args["gid"],"gid"], //Group ID
			"termType":[args["terminalId"],"termid"],//终端类型
			"platid":[args["platid"],"platid"],
			"splatid":[args["splatid"],"splatid"],
			"appid":[args["appid"],"appid"], // 应用类型
			"methods":[args["methods"],"methods"], //UTP 或者 WEB
			"sid":[args["sid"],"sid"],  //streamID  一路视频的分享率
			"ch":[args["ch"],"ch"],
			"p1":[args["p1"],"p1"],
			"p2":[args["p2"],"p2"],
			"p3":[args["p3"],"p3"],
			"country":[args["country"],"country"],
			"province":[args["province"],"province"]
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
  		
		var beginQueryTime = new Date().getTime();
		
		db.query(mysql, function(err, rows) {
		logs.logger.info("sql: "+mysql);
			res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) 
			{
				if (!rows.length) {
					res.result = "zero";
				}
				else 
				{
					var i = 0;	        	
					rows.forEach(function( _value ) {
		//				logs.logger.info("result:"+JSON.stringify(_value));
						var index = i;
						i++;
				   
						var strDateTime = (_value['show_time_segment']);
						var repCount = isNaN(Number(_value['stage_rep_count']))?0:Number(_value['stage_rep_count']);
						var act_rep_zero = isNaN(Number(_value['act_rep_zero']))?0:Number(_value['act_rep_zero']);
						var act_rep_one = isNaN(Number(_value['act_rep_one']))?0:Number(_value['act_rep_one']);
						var act_rep_two = isNaN(Number(_value['act_rep_two']))?0:Number(_value['act_rep_two']);
						var act_rep_three = isNaN(Number(_value['act_rep_three']))?0:Number(_value['act_rep_three']);
						var act_rep_four = isNaN(Number(_value['act_rep_four']))?0:Number(_value['act_rep_four']);
						var act_rep_five = isNaN(Number(_value['act_rep_five']))?0:Number(_value['act_rep_five']);
						var act_success_one = isNaN(Number(_value['act_success_one']))?0:Number(_value['act_success_one']);
						var act_time_one = isNaN(Number(_value['act_time_one']))?0:Number(_value['act_time_one']);
						var act_time_two = isNaN(Number(_value['act_time_two']))?0:Number(_value['act_time_two']);
						var act_time_three = isNaN(Number(_value['act_time_three']))?0:Number(_value['act_time_three']);
						var act_time_four = isNaN(Number(_value['act_time_four']))?0:Number(_value['act_time_four']);
						var act_time_five = isNaN(Number(_value['act_time_five']))?0:Number(_value['act_time_five']);
						
						var act_rep_eight = isNaN(Number(_value['act_rep_eight']))?0:Number(_value['act_rep_eight']);
						var act_rep_eleven = isNaN(Number(_value['act_rep_eleven']))?0:Number(_value['act_rep_eleven']);
						var act_rep_twelve = isNaN(Number(_value['act_rep_twelve']))?0:Number(_value['act_rep_twelve']);
						var act_time_eight = isNaN(Number(_value['act_time_eight']))?0:Number(_value['act_time_eight']);
						var act_time_eleven = isNaN(Number(_value['act_time_eleven']))?0:Number(_value['act_time_eleven']);
						var act_time_twelve = isNaN(Number(_value['act_time_twelve']))?0:Number(_value['act_time_twelve']);
						var size1 = isNaN(Number(_value['size1']))?0:Number(_value['size1']);
						var size2 = isNaN(Number(_value['size2']))?0:Number(_value['size2']);
						var hit_rate = 0.0;

						if(size1 > 0)
						{
							hit_rate = (size2/size1).toFixed(1);
						}
						else 
						{
							hit_rate = 0.0;
						}
						 //["2014-04-08 15:34:26","����ʱ��",������,ck,hs,selector,hs,rtmfp,hs,gather,hs,p2p,hs]	
						res.data[index] = [strDateTime,
							(act_rep_zero==0?0:((repCount/act_rep_zero).toFixed(1))),
							act_rep_zero,
							(act_rep_zero==0?0:(100*act_success_one/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_one/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_two/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_two/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_three/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_three/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_four/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_four/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_five/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_five/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_eight/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_eight/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_eleven/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_eleven/repCount).toFixed(2):0,
							( (act_rep_zero==0?0:100*act_rep_twelve/act_rep_zero).toFixed(0)) + '%',
							repCount?(act_time_twelve/repCount).toFixed(2):0,
						//	( (hit_rate==0?0.0:hit_rate).toFixed(1))+'%',
							size1,
							size2,
							hit_rate+"%"
						];	
					});
				}
			}
			else{
				logs.logger.error("query hisdata_stagequality: "+err);
				res.result = "failed";
			}
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};


//film duration
exports.query_hisdata_filmduration = function(args) {
	var thisObj = this;
	var res = {};
	res.data = [];
	var arr= [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var tb_prefix = "bitrate_duration_";
		var typ_list = ["vod","liv","dl"];
		var typVar = Number(args["typVar"]);
		var useTable = [];
		var useTableAlias = [];
		//播放类型全部，运营商全部
		if( -1 == typVar )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				useTable.push(tb_prefix+typ_list[typId]);
				useTableAlias.push("t_"+typId);
			}
		}
		if( -1 != typVar && typVar >=0 )
		{
				useTable.push(tb_prefix+typ_list[typVar]);
				useTableAlias.push("t_"+typVar);
		}
		
		if(useTable.length == 0)
		{
			logs.logger.error("query_hisdata_bitrateduration->tables error")
		}
		
		var selectElement = "sum( cdn_size) cdn_size,sum( p2p_pc_size) p2p_pc_size, "+
		"sum( p2p_tv_size) p2p_tv_size, sum( p2p_box_size) p2p_box_size, "+
		"sum( p2p_mo_size) p2p_mo_size, sum( cde_pc_size) cde_pc_size ,"+
		"sum( cde_tv_size) cde_tv_size, sum( cde_box_size) cde_box_size ,"+
		"sum( cde_mo_size) cde_mo_size, sum( lpsize) lpsize ,sum(lsize_cde) lsize_cde,"+
		"sum( conn_node_times) conn_node_times ,"+
		"sum( bitrate_duration_count)bitrate_duration_count,  duration";
		
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],
			"_toDate":args["to"],
			"_fromDate":args["from"],
			"version":[args["verVar"],"version"],
			"termType":[args["terminalId"],"termid"],
			"duration":"1",
			"appid":[args["appid"],"appid"], // 应用类型
			"country":[args["country"],"country"], // 应用类型
			"province":[args["province"],"province"] // 应用类型
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
		
		logs.logger.info("film sql:"+mysql);
		var arr = new Array();
		var tmp_arr = new Array();
		for(var j=0;j<6;j++){
			tmp_arr[j] = new Array();
			tmp_arr[j][0] = "0.00%";
			tmp_arr[j][1] = 0;
		}
		var tmp_count = 0 ;
		var tmpDateTime = 0 ;
		
		var beginQueryTime = new Date().getTime();
		var arr1 = new Array();
		db.query(mysql, function(err, rows) {
		res.queryTime = new Date().getTime() - beginQueryTime;
    	 if (!err) 
    	 {
	    	 if (!rows.length) {
	            res.result = "zero";
	        }
	        else 
	        {
//["2014-06-18 12","0.00%","0","0.00%","4","0.00","0.00","0.00%","0.00","0.00","0.00","0.00","0.00",14],
//["2014-06-18 12","0.07","0.07","0.00","0.00","0.00","0.00","2.32%","0.04","0.00","0.00","0.00","0.00",69]
/*
+---------------+--------------+---------------+-------------+--------------+-------------+-----------------+------------------------+----------+
| time_stamp    | cdn_size     | p2p_pc_size   | p2p_tv_size | p2p_box_size | p2p_mo_size | conn_node_times | bitrate_duration_count | duration |
+---------------+--------------+---------------+-------------+--------------+-------------+-----------------+------------------------+----------+
| 2014-06-18 12 |      8194544 |             0 |           0 |            0 |           0 |               0 |                     14 |        2 |
| 2014-06-18 12 |     72903392 |       1728472 |           0 |            0 |           0 |               3 |                     69 |        3 |
| 2014-06-18 12 |    763252740 |      20273920 |           0 |            0 |           0 |             637 |                    684 |        4 |
| 2014-06-18 13 |            0 |             0 |           0 |            0 |           0 |               0 |                      2 |        1 |
| 2014-06-18 13 |      8213908 |             0 |           0 |            0 |           0 |               0 |                     12 |        2 |
| 2014-06-18 13 |     87225232 |        677364 |           0 |            0 |           0 |               2 |                     79 |        3 |
| 2014-06-18 14 |   3781431248 |     717709928 |           0 |            0 |           0 |            1092 |                   1122 |        5 |
| 2014-06-18 14 | 888990132208 | 1012575842232 |           0 |            0 |           0 |          633428 |                 181836 |        6 |
+---------------+--------------+---------------+-------------+--------------+-------------+-----------------+------------------------+----------+
*/
				var i = 0;	 
				var duration_num = 1;
				rows.forEach(function( _value ) {
					var index = i;
	            	
					var strDateTime = (_value['show_time_segment']);
			            	var strDuration = (_value['duration']);
	       			     	var rep_count = Number(_value['bitrate_duration_count'])||0;
	            			var cdn = isNaN(Number(_value['cdn_size']))?0:Number(_value['cdn_size']);
					var pc = isNaN(Number(_value['p2p_pc_size']))?0:Number(_value['p2p_pc_size']);
					var tv = isNaN(Number(_value['p2p_tv_size']))?0:Number(_value['p2p_tv_size']);
					var box = isNaN(Number(_value['p2p_box_size']))?0:Number(_value['p2p_box_size']);
					var mb = isNaN(Number(_value['p2p_mo_size']))?0:Number(_value['p2p_mo_size']);
					var cde_pc = isNaN(Number(_value['cde_pc_size']))?0:Number(_value['cde_pc_size']);
					var cde_tv = isNaN(Number(_value['cde_tv_size']))?0:Number(_value['cde_tv_size']);
					var cde_box =isNaN(Number(_value['cde_box_size']))?0:Number(_value['cde_box_size']);
					var cde_mb = isNaN(Number(_value['cde_mo_size']))?0:Number(_value['cde_mo_size']);
					var lp = isNaN(Number(_value['lpsize']))?0:Number(_value['lpsize']);
					var lsize_cde = isNaN(Number(_value['lsize_cde']))?0:Number(_value['lsize_cde']);
					var allSize = cdn + pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb + lsize_cde;
					
					if(tmpDateTime != strDateTime && tmp_count != 0){
						i++;
						arr=tmp_arr[0].concat(tmp_arr[1]).concat(tmp_arr[2]).concat(tmp_arr[3]).concat(tmp_arr[4]).concat(tmp_arr[5]);
						var tmp_sum = tmp_arr[0][1]+tmp_arr[1][1]+tmp_arr[2][1]+tmp_arr[3][1]+tmp_arr[4][1]+tmp_arr[5][1];
						arr[1] = (tmp_sum == 0?0.00:(tmp_arr[0][1]/tmp_sum*100).toFixed(2)+"%");
						arr[3] = (tmp_sum == 0?0.00:(tmp_arr[1][1]/tmp_sum*100).toFixed(2)+"%");
						arr[5] = (tmp_sum == 0?0.00:(tmp_arr[2][1]/tmp_sum*100).toFixed(2)+"%");
						arr[7] = (tmp_sum == 0?0.00:(tmp_arr[3][1]/tmp_sum*100).toFixed(2)+"%");
						arr[9] = (tmp_sum == 0?0.00:(tmp_arr[4][1]/tmp_sum*100).toFixed(2)+"%");
						arr[11] = (tmp_sum == 0?0.00:(tmp_arr[5][1]/tmp_sum*100).toFixed(2)+"%");
						arr.unshift(tmpDateTime);
				//		logs.logger.info("res.data: "+JSON.stringify(arr));
						res.data[index] = arr;
						tmp_sum = 0;
					}
					switch(strDuration)
					{
						case 1:
							tmp_arr[0] = new Array();
							tmp_arr[0].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
							tmp_arr[0].push(rep_count);
							break;
						case 2:
							tmp_arr[1] = new Array();
							tmp_arr[1].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
							tmp_arr[1].push(rep_count);
							break;
						case 3:
							tmp_arr[2] = new Array();
							tmp_arr[2].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
							tmp_arr[2].push(rep_count);
							break;
						case 4:
							tmp_arr[3] = new Array();
							tmp_arr[3].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
							tmp_arr[3].push(rep_count);
							break;
						case 5:
							tmp_arr[4] = new Array();
							tmp_arr[4].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
							tmp_arr[4].push(rep_count);
							break;
						case 6:
							tmp_arr[5] = new Array();
							tmp_arr[5].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
							tmp_arr[5].push(rep_count);
							break;
					}
					tmp_count = 1;
					tmpDateTime = strDateTime;
					
	            });
				if(tmp_arr.length>0)
				{
					arr=tmp_arr[0].concat(tmp_arr[1]).concat(tmp_arr[2]).concat(tmp_arr[3]).concat(tmp_arr[4]).concat(tmp_arr[5]);
					var tmp_sum = tmp_arr[0][1]+tmp_arr[1][1]+tmp_arr[2][1]+tmp_arr[3][1]+tmp_arr[4][1]+tmp_arr[5][1];
					arr[1] = (tmp_sum == 0?0.00:(tmp_arr[0][1]/tmp_sum*100).toFixed(2)+"%");
					arr[3] = (tmp_sum == 0?0.00:(tmp_arr[1][1]/tmp_sum*100).toFixed(2)+"%");
					arr[5] = (tmp_sum == 0?0.00:(tmp_arr[2][1]/tmp_sum*100).toFixed(2)+"%");
					arr[7] = (tmp_sum == 0?0.00:(tmp_arr[3][1]/tmp_sum*100).toFixed(2)+"%");
					arr[9] = (tmp_sum == 0?0.00:(tmp_arr[4][1]/tmp_sum*100).toFixed(2)+"%");
					arr[11] = (tmp_sum == 0?0.00:(tmp_arr[5][1]/tmp_sum*100).toFixed(2)+"%");
					arr.unshift(tmpDateTime);
					res.data[i] = arr;
				}
	        }
    	 }else{
    	 	logs.logger.error("query hisdata_filmduration: "+err);
    	 	res.result = "failed";
    	 }
    	// logs.logger.info("result:"+JSON.stringify( res ));
    	 thisObj.responseDirect(200, "text/json", JSON.stringify(res));
    });
  }
  else{
    res.result = "expired";
    thisObj.responseDirect(200, "text/json", JSON.stringify(res));
  }
};

//video bitrate
exports.query_hisdata_videobitrate = function(args) {
	var thisObj = this;
	var res = {};
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var tb_prefix = "bitrate_duration_";
		var typ_list = ["vod","liv","dl"];
		var typVar = Number(args["typVar"]);
		var useTable = [];
		var useTableAlias = [];
		//播放类型全部，运营商全部
		if( -1 == typVar )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				useTable.push(tb_prefix+typ_list[typId]);
				useTableAlias.push("t_"+typId);
			}
		}
		if( -1 != typVar && typVar >=0 )
		{
				useTable.push(tb_prefix+typ_list[typVar]);
				useTableAlias.push("t_"+typVar);
		}
		
		if(useTable.length == 0)
		{
			logs.logger.error("query_hisdata_bitrateduration->tables error")
		}
		
		var selectElement = "sum( cdn_size) cdn_size ,sum( p2p_pc_size) p2p_pc_size ,"+
		"sum( p2p_tv_size) p2p_tv_size,sum( p2p_box_size) p2p_box_size,"+
		"sum( p2p_mo_size) p2p_mo_size,sum( cde_pc_size) cde_pc_size ,"+
		"sum( cde_tv_size) cde_tv_size, sum( cde_box_size) cde_box_size ,"+
		"sum( cde_mo_size) cde_mo_size, sum( lpsize) lpsize ,sum(lsize_cde) lsize_cde,"+
		"sum( conn_node_times) conn_node_times ,"+
		"sum( bitrate_duration_count)bitrate_duration_count, bitrate";
		
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],
			"_toDate":args["to"],
			"_fromDate":args["from"],
			"version":[args["verVar"],"version"],
			"termType":[args["terminalId"],"termid"],
			"protocol":[args["protocolId"],"protocol"],
			"appid":[args["appid"],"appid"] // 应用类型
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
		//logs.logger.info("mysql:"+mysql);
		var arr = new Array();
		var tmp_arr = new Array();
		for(var j=0;j<8;j++){
			tmp_arr[j] = new Array();
			tmp_arr[j][0] = "0.00%";
			tmp_arr[j][1] = 0;
		}
		var beginQueryTime = new Date().getTime();
		var tmp_count = 0 ;
		var tmpDateTime = 0 ;
		db.query(mysql, function(err, rows) {		
			res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err)
			{
				if (!rows.length) {
					res.result = "zero";
				}
				else 
				{
					var i = 0;	        	
					rows.forEach(function( _value ) {
						var index = i;
						
						var strDateTime = (_value['show_time_segment']);
						var strBitrate = (_value['bitrate']);
						var rep_count = Number(_value['bitrate_duration_count'])||0;
						var cdn = isNaN(Number(_value['cdn_size']))?0:Number(_value['cdn_size']);
						var pc = isNaN(Number(_value['p2p_pc_size']))?0:Number(_value['p2p_pc_size']);
						var tv = isNaN(Number(_value['p2p_tv_size']))?0:Number(_value['p2p_tv_size']);
						var box = isNaN(Number(_value['p2p_box_size']))?0:Number(_value['p2p_box_size']);
						var mb = isNaN(Number(_value['p2p_mo_size']))?0:Number(_value['p2p_mo_size']);
						var cde_pc = isNaN(Number(_value['cde_pc_size']))?0:Number(_value['cde_pc_size']);
						var cde_tv = isNaN(Number(_value['cde_tv_size']))?0:Number(_value['cde_tv_size']);
						var cde_box =isNaN(Number(_value['cde_box_size']))?0:Number(_value['cde_box_size']);
						var cde_mb = isNaN(Number(_value['cde_mo_size']))?0:Number(_value['cde_mo_size']);
						var lp = isNaN(Number(_value['lpsize']))?0:Number(_value['lpsize']);
						var lsize_cde = isNaN(Number(_value['lsize_cde']))?0:Number(_value['lsize_cde']);
						var allSize = cdn + pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb + lsize_cde;
					
						
						if(tmpDateTime != strDateTime && tmp_count != 0){
							i++;
							arr=tmp_arr[0].concat(tmp_arr[1]).concat(tmp_arr[2]).concat(tmp_arr[3]).concat(tmp_arr[4]).concat(tmp_arr[5]).concat(tmp_arr[6]).concat(tmp_arr[7]);
							var tmp_sum = tmp_arr[0][1]+tmp_arr[1][1]+tmp_arr[2][1]+tmp_arr[3][1]+tmp_arr[4][1]+tmp_arr[5][1]+tmp_arr[6][1]+tmp_arr[7][1];
							arr[1] = (tmp_sum == 0?0.00:(tmp_arr[0][1]/tmp_sum*100).toFixed(2)+"%");
							arr[3] = (tmp_sum == 0?0.00:(tmp_arr[1][1]/tmp_sum*100).toFixed(2)+"%");
							arr[5] = (tmp_sum == 0?0.00:(tmp_arr[2][1]/tmp_sum*100).toFixed(2)+"%");
							arr[7] = (tmp_sum == 0?0.00:(tmp_arr[3][1]/tmp_sum*100).toFixed(2)+"%");
							arr[9] = (tmp_sum == 0?0.00:(tmp_arr[4][1]/tmp_sum*100).toFixed(2)+"%");
							arr[11] = (tmp_sum == 0?0.00:(tmp_arr[5][1]/tmp_sum*100).toFixed(2)+"%");
							arr[13] = (tmp_sum == 0?0.00:(tmp_arr[6][1]/tmp_sum*100).toFixed(2)+"%");
							arr[15] = (tmp_sum == 0?0.00:(tmp_arr[7][1]/tmp_sum*100).toFixed(2)+"%");
							arr.unshift(tmpDateTime);
					//		logs.logger.info("res.data: "+JSON.stringify(arr));
							res.data[index] = arr;
							tmp_sum = 0;
						}
						
						if(args["protocolId"] == 0)
						{
							tmp_count = 1;
							switch(strBitrate)
							{
								case 13:
									tmp_arr[2] = new Array();
									tmp_arr[2].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[2].push(rep_count);
									break;
								case 21:
									tmp_arr[1] = new Array();
									tmp_arr[1].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[1].push(rep_count);
									break;
								case 22:
									tmp_arr[3] = new Array();
									tmp_arr[3].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[3].push(rep_count);
									break;
								case 51:
									tmp_arr[4] = new Array();
									tmp_arr[4].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[4].push(rep_count);
									break;
								case 52:
									tmp_arr[5] = new Array();
									tmp_arr[5].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[5].push(rep_count);
									break;
								case 53:
									tmp_arr[6] = new Array();
									tmp_arr[6].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[6].push(rep_count);
									break;
								case 54:
									tmp_arr[7] = new Array();
									tmp_arr[7].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[7].push(rep_count);
									break;
								case 58:
									tmp_arr[0] = new Array();
									tmp_arr[0].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[0].push(rep_count);
									break;
							}
						}
						else {
							switch(strBitrate)
							{
								case 1:
									tmp_arr[1] = new Array();
									tmp_arr[1].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[1].push(rep_count);
									break;
								case 16:
									tmp_arr[2] = new Array();
									tmp_arr[2].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[2].push(rep_count);
									break;
								case 17:
									tmp_arr[3] = new Array();
									tmp_arr[3].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[3].push(rep_count);
									break;
								case 18:
									tmp_arr[4] = new Array();
									tmp_arr[4].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[4].push(rep_count);
									break;
								case 20:
									tmp_arr[6] = new Array();
									tmp_arr[6].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[6].push(rep_count);
									break;
								case 35:
									tmp_arr[5] = new Array();
									tmp_arr[5].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[5].push(rep_count);
									break;
								case 44:
									tmp_arr[7] = new Array();
									tmp_arr[7].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[7].push(rep_count);
									break;
								case 57:
									tmp_arr[0] = new Array();
									tmp_arr[0].push((allSize == 0?0.00:(100 * (allSize - cdn)/allSize)).toFixed(2)+"%");
									tmp_arr[0].push(rep_count);
									break;
							}
						}
						tmpDateTime = strDateTime;
					});
					if(tmp_arr.length>0)
					{
						arr=tmp_arr[0].concat(tmp_arr[1]).concat(tmp_arr[2]).concat(tmp_arr[3]).concat(tmp_arr[4]).concat(tmp_arr[5]).concat(tmp_arr[6]).concat(tmp_arr[7]);
						var tmp_sum = tmp_arr[0][1]+tmp_arr[1][1]+tmp_arr[2][1]+tmp_arr[3][1]+tmp_arr[4][1]+tmp_arr[5][1]+tmp_arr[6][1]+tmp_arr[7][1];
						arr[1] = (tmp_sum == 0?0.00:(tmp_arr[0][1]/tmp_sum*100).toFixed(2)+"%");
						arr[3] = (tmp_sum == 0?0.00:(tmp_arr[1][1]/tmp_sum*100).toFixed(2)+"%");
						arr[5] = (tmp_sum == 0?0.00:(tmp_arr[2][1]/tmp_sum*100).toFixed(2)+"%");
						arr[7] = (tmp_sum == 0?0.00:(tmp_arr[3][1]/tmp_sum*100).toFixed(2)+"%");
						arr[9] = (tmp_sum == 0?0.00:(tmp_arr[4][1]/tmp_sum*100).toFixed(2)+"%");
						arr[11] = (tmp_sum == 0?0.00:(tmp_arr[5][1]/tmp_sum*100).toFixed(2)+"%");
						arr[13] = (tmp_sum == 0?0.00:(tmp_arr[6][1]/tmp_sum*100).toFixed(2)+"%");
						arr[15] = (tmp_sum == 0?0.00:(tmp_arr[7][1]/tmp_sum*100).toFixed(2)+"%");
						arr.unshift(tmpDateTime);
						res.data[i] = arr;
					}
				}
			}else{
				logs.logger.error("query hisdata_filmduration: "+err);
				res.result = "failed";
			}
		//	logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

//pl
exports.query_hisdata_pl = function(args) {
	var thisObj = this;
	var res = {};
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var tb_prefix = "pl_data";
		var useTable = [];
		var useTableAlias = [];
		useTable.push("pl_data");
		if(useTable.length == 0)
		{
			logs.logger.error("query_hisdata_pl->tables error")
		}
		
		var selectElement = "sum(pl_count) pl_count,sum(act_one) act_one,sum(triffic_count) triffic_count, sum(block) block,sum(bcnt) bcnt";
		
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],
			"_toDate":args["to"],
			"_fromDate":args["from"],
			"platid":[args["platid"],"platid"],//平台类型
			"splatid":[args["splatid"],"splatid"],//子平台类型
			"appid":[args["appid"],"appid"] // 应用类型
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
		//logs.logger.info("mysql:"+mysql);
		console.log("video mysql: "+mysql);
		var arr = new Array();

		var beginQueryTime = new Date().getTime();
		//logs.logger.info("mysql:"+mysql);
		db.query(mysql, function(err, rows) {
			res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err)
			{
				if (!rows.length) {
					res.result = "zero";
				}
				else 
				{
					var i = 0;	        	
					rows.forEach(function( _value ) {
						var index=i;
						i++;
						var strDateTime = (_value['show_time_segment']);
						var pl_count = Number(_value['pl_count'])||0;
						var act_one = Number(_value['act_one']);
						var block = isNaN(Number(_value['block']))?0:Number(_value['block']);
						var triffic_count = Number(_value['triffic_count'])||0;
						var bcnt = Number(_value['bcnt']);

						res.data[index] = [strDateTime,
							act_one,
							block,
							(act_one==0?0.00:(block/act_one*100).toFixed(2))+"%",
							triffic_count,
							bcnt,
							(triffic_count==0?0.00:(bcnt/triffic_count*100).toFixed(2))+"%"
							];
					});
				}
			}
			else{
				logs.logger.error("query hisdata_ratio: "+err);
				res.result = "failed";
			}
	//		logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}
	else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

exports.query_table_all_share = function(args) {
  var thisObj = this;
  //var client = dbClientG;
  var res = {};
 
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var tb_prefix = "share_rate_";
		var typ_list = ["vod","liv","dl"];
		var idc_list = ["unicom","telecom","other"];
		var typVar = Number(args["typVar"]);
		var idcVar = Number(args["idcVar"]);
		var useTable = [];
		var useTableAlias = [];
		
		//播放类型全部，运营商全部
		if( -1 == typVar  && -1 == idcVar )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 0; idcId < idc_list.length; idcId++ )
				{
						useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
						useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if(-2 == idcVar && -1 == typVar)
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				for(var idcId = 0; idcId < 2; idcId++ )
				{
					useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typId+"_"+idcId);
				}
			}
		}
		if( -2 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 0; idcId < 2; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		//播放类型全部，运营商传过来值
		if( -1 == typVar && idcVar >= 0 && idcVar < idc_list.length )
		{
			for(var typId = 0; typId < typ_list.length; typId++ )
			{
				useTable.push(tb_prefix+typ_list[typId]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typId+"_"+idcVar);
			}
		}
		//播放类型传过来，运营商固定
		if( -1 == idcVar && typVar >= 0 && typVar < typ_list.length )
		{
			for(var idcId = 0; idcId < idc_list.length; idcId++ )
			{
					useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcId]);
					useTableAlias.push("t_"+typVar+"_"+idcId);
			}
		}
		//
		if( -1 != typVar && typVar >=0 && -1 != idcVar && idcVar >= 0 )
		{
				useTable.push(tb_prefix+typ_list[typVar]+"_"+idc_list[idcVar]);
				useTableAlias.push("t_"+typVar+"_"+idcVar);
		}
		
		if(useTable.length == 0)
		{
			logs.logger.error("query_table_all_share->tables error")
		}

		var selectElement = "sum( cdn_size) cdn_size ,sum( p2p_pc_size) p2p_pc_size ,"+
		"sum( p2p_tv_size) p2p_tv_size, sum( p2p_box_size) p2p_box_size ,"+
		"sum( p2p_mo_size) p2p_mo_size,sum( cde_pc_size) cde_pc_size ,"+
		"sum( cde_tv_size) cde_tv_size, sum( cde_box_size) cde_box_size ,"+
		"sum( cde_mo_size) cde_mo_size, sum( lpsize) lpsize ,sum( lcsize) lcsize ,sum(lsize_cde) lsize_cde,"+
		"sum( conn_node_times) conn_node_times ,sum( get_node_times) get_node_times ,"+
		"sum( conn_cde_times) conn_cde_times ,sum( get_cde_times) get_cde_times ,"+
		"sum( share_rep_count)share_rep_count, sum(act) act";
		
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],//按天查询
			"_toDate":args["to"],//止日期
			"_fromDate":args["from"],//起日期
			"version":[args["verVar"],"version"],//版本类型
			"gid":[args["gid"],"gid"], //Group ID
			"termType":[args["terminalId"],"termid"],//终端类型
			"platid":[args["platid"],"platid"],//平台类型
			"splatid":[args["splatid"],"splatid"],//子平台类型
			"appid":[args["appid"],"appid"], // 应用类型
			"methods":[args["methods"],"methods"], //UTP 或者 WEB
			"p":[args["p"],"p"],   //p=l 私有协议  p=r rtfmp协议
			"sid":[args["sid"],"sid"],  //streamID  一路视频的分享率
			"table_all_share":[args["table_all_share"],"table_all_share"] 
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
		var select_time = 0;
		if(args["type"] == "hour")
		{
			select_time = 3600;
		}
		else {
			select_time = 600;
		}
		var beginQueryTime = new Date().getTime();
		db.query(mysql, function(err, rows) {		
		 res.queryTime = new Date().getTime() - beginQueryTime;
    	 if (!err) 
    	 {
			if (!rows.length) {
				res.result = "zero";
	        }
	        else 
	        {
	        	var i = 0;	        	
				rows.forEach(function( _value ) {
              	var index = i;
	            	i++;
	            	var strDateTime = (_value['show_time_segment']);
	            	var rep_count = Number(_value['share_rep_count'])||0;
	            	var cdn = isNaN(Number(_value['cdn_size']))?0:Number(_value['cdn_size']);
					var pc = isNaN(Number(_value['p2p_pc_size']))?0:Number(_value['p2p_pc_size']);
					var tv = isNaN(Number(_value['p2p_tv_size']))?0:Number(_value['p2p_tv_size']);
					var box = isNaN(Number(_value['p2p_box_size']))?0:Number(_value['p2p_box_size']);
					var mb = isNaN(Number(_value['p2p_mo_size']))?0:Number(_value['p2p_mo_size']);
					var cde_pc = isNaN(Number(_value['cde_pc_size']))?0:Number(_value['cde_pc_size']);
					var cde_tv = isNaN(Number(_value['cde_tv_size']))?0:Number(_value['cde_tv_size']);
					var cde_box = isNaN(Number(_value['cde_box_size']))?0:Number(_value['cde_box_size']);
					var cde_mb = isNaN(Number(_value['cde_mo_size']))?0:Number(_value['cde_mo_size']);
					var lp = isNaN(Number(_value['lpsize']))?0:Number(_value['lpsize']);
					var lc = isNaN(Number(_value['lcsize']))?0:Number(_value['lcsize']);
					var lsize_cde = isNaN(Number(_value['lsize_cde']))?0:Number(_value['lsize_cde']);
					var rtmfp_size = pc + tv + box + mb ;
					var cde_size = cde_pc + cde_tv + cde_box + cde_mb + lsize_cde;
					var allSize = cdn + pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb +lsize_cde;
					var cdnBandwidth = cdn*8/(1024 * 1024 * 1024*select_time);
					var saveBandwidth = (allSize - cdn)*8/(1024 * 1024 * 1024*select_time);
					var rtmfp_node = rep_count ? Number(_value['conn_node_times']/(rep_count)).toFixed(2) : 0;
					var cde_node = rep_count ? Number(_value['conn_cde_times']/(rep_count)).toFixed(2) : 0;
					
					var act = isNaN(Number(_value['act']))?0:Number(_value['act']);
					var online_people = (rep_count/600*60).toFixed(0);
					var video_rate = allSize*8*1024*1024/rep_count/60;  //allSize*8 *1024*1024/时间/在线人数
					
					 res.data[index] = [strDateTime,
					 (allSize/(1024 * 1024 * 1024)).toFixed(2),
					 (cdn/(1024 * 1024 * 1024)).toFixed(2),
				//	 (allSize==0?0:(100 * (allSize - cdn)/ allSize).toFixed(2)) + '%',
					 (rtmfp_size == 0?0:(100*rtmfp_size/allSize).toFixed(2))+ '%',
					 (cde_size == 0?0:(100*cde_size/allSize).toFixed(2))+ '%',
				//	  video_rate.toFixed(2),
				//	  (rep_count/10).toFixed(0),
					  rep_count ? Number(_value['conn_node_times']/(rep_count)).toFixed(2) : 0,
					  rep_count ? Number(_value['conn_cde_times']/(rep_count)).toFixed(2) : 0,
					  (Number(rtmfp_node)+Number(cde_node)).toFixed(2),
					 (cdnBandwidth*1.488).toFixed(2),
					 (saveBandwidth*1.488).toFixed(2),
					 (allSize==0?0:(100 * (allSize - cdn)/ allSize).toFixed(2)) + '%',												//p2p分享率
					 online_people,																									//在线人数
					 (video_rate/1024/1024/1024).toFixed(0),																			//平均码率
					 act==0?0.0:((rep_count/act).toFixed(1)),																			//时长
					 (((pc+cde_pc)/(pc + tv + box + mb + cde_pc + cde_tv + cde_box + cde_mb)*100).toFixed(1))+'%'                    //pc贡献比
					 ]
					 
	            });
	        }
    	 }else{
    	 	logs.logger.error("query table_all_share: "+err);
    	 	res.result = "failed";
    	 }
    	 thisObj.responseDirect(200, "text/json", JSON.stringify(res));
    });
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};


//{"data":[["2014-04-07 00:34:26","2%","36%","7%","5%","4%","3%","3%","4%","37%","27793648"],["2014-04-07 01:34:26","2%","38%","7%","5%","4%","3%","3%","3%","34%","18894498"],["2014-04-07 02:34:26","2%","40%","8%","5%","4%","3%","3%","3%","31%","13539037"],["2014-04-07 03:34:26","2%","40%","8%","6%","4%","3%","3%","3%","30%","10524692"],["2014-04-07 04:34:26","3%","40%","8%","6%","4%","4%","3%","3%","30%","9012611"],["2014-04-07 05:34:26","3%","39%","9%","6%","4%","4%","3%","3%","29%","8325665"],["2014-04-07 06:34:26","3%","40%","9%","6%","4%","4%","3%","3%","29%","8119280"],["2014-04-07 07:34:26","2%","42%","9%","6%","4%","3%","3%","3%","28%","9452367"],["2014-04-07 08:34:26","2%","42%","8%","6%","4%","4%","3%","3%","29%","13640080"],["2014-04-07 13:34:26","2%","34%","6%","5%","4%","4%","3%","4%","38%","36398856"],["2014-04-08 14:34:26","2%","34%","6%","5%","4%","4%","3%","4%","38%","32869238"],["2014-04-08 15:34:26","2%","34%","6%","5%","4%","4%","3%","4%","38%","31636569"]],"result":"success"}
	exports.query_hisdata_groupid = function(args) 
	{
		var thisObj = this;
		var res = {};
		res.data =[];
		res.result = "success";
		var sess = validate(this.req);
		if (sess) 
		{
			var tb_prefix = "node_distri_";
			var typVar = Number(args["typVar"]);
			var useTable = [];
			var useTableAlias = [];
			
			if(useTable.length == 0)
			{
				logs.logger.error("query_hisdata_groupid->tables error")
			}
			
			logs.logger.info("args:"+JSON.stringify(args)+"\n\n");
			
			var selectElement = "sum( node_rep_count) node_rep_count ,sum( no_node_heart) no_node_heart ,sum( forbid_node_heart) forbid_node_heart ,"+
			"sum( zero_node_heart) zero_node_heart ,sum( one_node_heart) one_node_heart ,sum( two_node_heart) two_node_heart ,"+
			"sum( three_node_heart) three_node_heart ,sum( four_node_heart) four_node_heart ,sum( five_node_heart) five_node_heart ,"+
			"sum( six_node_heart) six_node_heart ,sum( other_node_heart) other_node_heart ";
			
			var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
			useTable,//��ݱ���
			useTableAlias,
			"T_m",//��ݱ����
			{
				"_asDay":args["type"],//�Ƿ������,��������
				"_toDate":args["to"],//����ʱ��,��������
				"_fromDate":args["from"],//��ʼʱ��,��������
				"version":[args["verVar"],"version"],//�汾
				"termType":[args["terminalId"],"termid"]//,//�ն�����
			},//where �����ж�
			selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
			"time_stamp"//��ʶʱ����ֶ�
			);
			
			logs.logger.info("mysql:"+mysql);		
			var beginQueryTime = new Date().getTime();
			db.query(mysql, function(err, rows) {		
				res.queryTime = new Date().getTime() - beginQueryTime;
				if (!err){
					if (!rows.length) {
						res.result = "zero";
					}
					else 
					{
						var i = 0;
						rows.forEach(function( _value ) {
							var index = i;
							i++;
							var strDateTime = (_value['show_time_segment']);
							var total = Number(_value['no_node_heart'])+Number(_value['forbid_node_heart'])+Number(_value['zero_node_heart'])+
							Number(_value['one_node_heart'])+Number(_value['two_node_heart'])+Number(_value['three_node_heart'])+
							Number(_value['four_node_heart'])+Number(_value['five_node_heart'])+Number(_value['six_node_heart'])+
							Number(_value['other_node_heart']);
							total = isNaN(total)?0:total;
							var no_node_ratio = total==0?0:(100*Number(_value['no_node_heart'])/total).toFixed(1)+'%';
							var forbid_node_ratio = total==0?0:(100*Number(_value['forbid_node_heart'])/total).toFixed(1)+'%';
							var zero_node_ratio = total==0?0:(100*Number(_value['zero_node_heart'])/total).toFixed(1)+'%';
							var one_node_ratio = total==0?0:(100*Number(_value['one_node_heart'])/total).toFixed(1)+'%';
							var two_node_ratio = total==0?0:(100*Number(_value['two_node_heart'])/total).toFixed(1)+'%';
							var three_node_ratio = total==0?0:(100*Number(_value['three_node_heart'])/total).toFixed(1)+'%';
							var four_node_ratio = total==0?0:(100*Number(_value['four_node_heart'])/total).toFixed(1)+'%';
							var five_node_ratio = total==0?0:(100*Number(_value['five_node_heart'])/total).toFixed(1)+'%';
							var six_node_ratio = total==0?0:(100*Number(_value['six_node_heart'])/total).toFixed(1)+'%';
							var other_node_ratio = total==0?0:(100*Number(_value['other_node_heart'])/total).toFixed(1)+'%';

							//var val_usrAll = Math.round(val['rtmfp_online']) ;
							res.data[index] = [strDateTime, no_node_ratio,forbid_node_ratio, zero_node_ratio,one_node_ratio,two_node_ratio,three_node_ratio,
							four_node_ratio,five_node_ratio,six_node_ratio,other_node_ratio,Number(_value['node_rep_count'])];
						});	            
					}
				}else{
					logs.logger.error("query hisdata_groupid: "+err);
					res.result = "failed";
				}
	//			logs.logger.info("result:"+JSON.stringify( res ));
				thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			});
		}else{
			res.result = "expired";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		}
	};

//p2p upgrade
exports.query_upgrade_version = function(args) {
  var thisObj = this;
  var res = {};
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var useTable = [];
		var useTableAlias = [];
		var accumulate = 0;
		
		useTable.push("upgrade_version");
		useTableAlias.push("t");
		var selectElement = "sum( act_result) act_result  ";
		
		var mysql = getMulTableSqlStatementBy_IpPort_Type_Ver_IDC (
		useTable,//��ݱ���
		useTableAlias,
		"T_m",//��ݱ����
		{
			"_asDay":args["type"],//按天查询
			"_toDate":args["to"],//止日期
			"_fromDate":args["from"],//起日期
			"aim":[args["aim"],"aim"],//目标版本类型
			"primary":[args["primary"],"primary"], //原版本类型
		//	"model":[args["model"],"model"],//设备型号
		//	"vendor":[args["vendor"],"vendor"],//设备厂商
		//	"rom":[args["rom"],"rom"],//设备 ROM 版本号
			"appid":[args["appid"],"appid"], // 应用类型
			"net_type":[args["net_type"],"net_type"], //网络类型
			"so":[args["so"],"so"],   //升级产品类型
			"upgrade_type":[args["upgrade_type"],"upgrade_type"],  //升级方式
			"termType":[args["termId"],"termId"]  //终端类型
		},//where �����ж�
		selectElement,//��ʱ���ֶβ�ѯ��sql�����sum(s.p1) p1 ,p2 ,p3... 
		"time_stamp"//��ʶʱ����ֶ�
		);
	
		var beginQueryTime = new Date().getTime();
		logs.logger.info("mysql:"+mysql);
		db.query(mysql, function(err, rows) {		
			res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) 
			{
				if (!rows.length) {
					res.result = "zero";
				}
				else 
				{
					var i = 0;	        	
					rows.forEach(function( _value ) {
					var index = i;
						i++;
						var strDateTime = (_value['show_time_segment']);
						var act_result = isNaN(Number(_value['act_result']))?0:Number(_value['act_result']);
						accumulate += act_result;
						
						res.data[index] = [strDateTime,
							act_result,
							accumulate
						]
					});
				}
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
//			logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};


upgradeSql = function(args)
{
	var condition_sql = '';
	var fromDate = new Date( args["from"] );
	var toDate = new Date( args['to'] );
	var fromDateFMT = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + fromDate.getDate();
	condition_sql = util.format("time_stamp > date_format('%s 00:00:00','%%Y-%%m-%%d %%H:%%i:%%s') ",fromDateFMT);
//	var toDataFMT = toDate.getFullYear()+"-"+(toDate.getMonth() + 1) + "-" + toDate.getDate();
	var toDataFMT = new Date(toDate.getTime()+3600*24*1000);//要比当前的期间晚一天
	toDataFMT = toDataFMT.getFullYear()+"-"+(toDataFMT.getMonth() + 1) + "-" + toDataFMT.getDate();
	condition_sql += " and "+util.format("time_stamp < date_format('%s 00:00:00','%%Y-%%m-%%d %%H:%%i:%%s') ",toDataFMT); 
	if(	args["isHour"] )
	
	if(	args["aim"] != -1 )
	{
		condition_sql += util.format(" and  ser_ver=%d ",args['aim']);
	}
	if(	args["primary"] != -1 )
	{
		condition_sql += util.format(" and  loc_ver=%d ",args['primary']);
	}
	/*
	if(args["model"] != -1 )
	{
		condition_sql += util.format(" and  model=%d ",args['model']);
	}
	if(args["vendor"] != -1 )
	{
		condition_sql += util.format(" and  vendor=%d ",args['vendor']);
	}
	if(args["rom"] != -1 )
	{
		condition_sql += util.format(" and  rom_ver=%d ",args['rom']);
	}
	*/
	if(args["appid"] != -1 )
	{
		condition_sql += util.format(" and  appid=%d ",args['appid']);
	}
	if(args["net_type"] != -1 )
	{
		condition_sql += util.format(" and  net_type=%d ",args['net_type']);
	}
	if(args["so"] != -1 )
	{
		condition_sql += util.format(" and  so=%d ",args['so']);
	}
	if(args["upgrade_type"] != -1 )
	{
		condition_sql += util.format(" and  type=%d ",args['upgrade_type']);
	}
	if(args["termId"] != -1 )
	{
		condition_sql += util.format(" and  termid=%d ",args['termId']);
	}
	return condition_sql;
}


upgradeSql = function(args)
{
	var condition_sql = '';
	var fromDate = new Date( args["from"] );
	var toDate = new Date( args['to'] );
	var fromDateFMT = fromDate.getFullYear() + "-" + (fromDate.getMonth() + 1) + "-" + fromDate.getDate();
	condition_sql = util.format("time_stamp > date_format('%s 00:00:00','%%Y-%%m-%%d %%H:%%i:%%s') ",fromDateFMT);
	var toDataFMT = toDate.getFullYear()+"-"+(toDate.getMonth() + 1) + "-" + toDate.getDate();
	condition_sql += " and "+util.format("time_stamp < date_format('%s 00:00:00','%%Y-%%m-%%d %%H:%%i:%%s') ",toDataFMT); 
	if(	args["isHour"] )
	
	if(	args["aim"] != -1 )
	{
		condition_sql += util.format(" and  ser_ver=%d ",args['aim']);
	}
	if(	args["primary"] != -1 )
	{
		condition_sql += util.format(" and  loc_ver=%d ",args['primary']);
	}
	/*
	if(args["model"] != -1 )
	{
		condition_sql += util.format(" and  model=%d ",args['model']);
	}
	if(args["vendor"] != -1 )
	{
		condition_sql += util.format(" and  vendor=%d ",args['vendor']);
	}
	if(args["rom"] != -1 )
	{
		condition_sql += util.format(" and  rom_ver=%d ",args['rom']);
	}
	*/
	if(args["appid"] != -1 )
	{
		condition_sql += util.format(" and  appid=%d ",args['appid']);
	}
	if(args["net_type"] != -1 )
	{
		condition_sql += util.format(" and  net_type=%d ",args['net_type']);
	}
	if(args["so"] != -1 )
	{
		condition_sql += util.format(" and  so=%d ",args['so']);
	}
	if(args["upgrade_type"] != -1 )
	{
		condition_sql += util.format(" and  type=%d ",args['upgrade_type']);
	}
	if(args["termId"] != -1 )
	{
		condition_sql += util.format(" and  termid=%d ",args['termId']);
	}
	return condition_sql;
}

exports.query_upgrade_accumulate = function(args) {
	var thisObj = this;
	var res = {};
	var mysql ="";
	var condition_sql = "";
	res.data = [];
	res.result = "success";
	var sess = validate(this.req);
	
	if (sess) { 
		mysql = "select sum(act_result) accumulate from upgrade_version where ";
		
		condition_sql += upgradeSql(args);
		mysql = mysql+condition_sql;
		//console.log("accumulate mysql:"+mysql);
		var beginQueryTime = new Date().getTime();
		db.query(mysql, function(err, rows) {	
		res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) 
			{
				if (!rows.length) {
					res.result = "zero";
				}
				else 
				{   
					var i = 0;	        	
					rows.forEach(function( _value ) {
					var index = i;
						i++;
						var accumulate = isNaN(Number(_value['accumulate']))?0:Number(_value['accumulate']);
						
						res.data[index] = [accumulate]
					});
				}
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
//			logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};


exports.query_upgrade_failed = function(args) {
	var thisObj = this;
	var res = {};
	res.data = [];
	var mysql ="";
	var condition_sql = "";
	res.result = "success";
	var sess = validate(this.req);
	if (sess) {
		var asDay = !args["type"] || args["type"] == "min";
		var mysql = "";
		var interval_minute = 10;//10分钟间隔
		args.byHour = asDay;
		if(asDay)
		{ 
			mysql ="select "
				+" DATE_FORMAT( "
				+" CONCAT( "
				+" (select date(time_stamp)) "
				+" , ' '"
				+" , (select hour(time_stamp)) "
				+" , ':' "
				+" , (select floor((select minute(time_stamp))/10))*10 "
				+" ) , "
				+" '%Y-%m-%d %H:%i' "
				+" )d_times "
				+" ,sum(act_result)act_result,result "
				+" from upgrade_version "
				+" where (";
			mysql += upgradeSql(args);
			mysql += " ) and ( ";
			
			for(var ii=0;ii<60;ii+=interval_minute)
			{
				condition_sql+=" ((select minute('time_stamp') ) >= "+ii+" and (select minute('time_stamp') ) < "+(ii+interval_minute)+") ";
				if(ii+interval_minute != 60 )
				{
					condition_sql+=" or ";
				}
			}
			mysql += condition_sql;
			mysql += ' ) group by d_times, result ';
		}else
		{
			mysql = "select DATE_FORMAT( time_stamp,'%Y-%m-%d %H') d_times,sum(act_result)act_result,result  from upgrade_version where ";
			condition_sql += upgradeSql(args);
			mysql = mysql+condition_sql;
			mysql += 'group by d_times, result';
		}
		
		
		var beginQueryTime = new Date().getTime();
		db.query(mysql, function(err, rows) {		
			res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) 
			{
				if (!rows.length) {
					res.result = "zero";
				}
				else 
				{
					var jasnList = [];
					var soList = [];
					var totalList = [];
					var i = 0;
					var len = rows.length;
					var time_reference = 0;
					var act_result = 0;
					var result = 0;
					var dataStructor = 0;
					var dataRecord = [];
					var timeRecord = []
/*
+---------------+-----------------+--------+
| d_times       | sum(act_result) | result |
+---------------+-----------------+--------+
| 2014-10-23 15 |               1 |     -1 | 
| 2014-10-23 15 |               3 |      0 | 
+---------------+-----------------+--------+
*/

					rows.forEach(function( _value ) {
						var index = i;
						i++;
						var strDateTime = (_value['d_times']);
						var hour = strDateTime.split(" ");
							hour = hour[1].split(":")[0];
						if( 0 == time_reference )
						{
							time_reference = strDateTime;
							
							dataStructor = {
								result_0:0
								,result_1:0
								,result_2:0
								,result_3:0
								,result_4:0
								,result_5:0
								,result_6:0
								,result_7:0
							};
							dataRecord[0] = [];//result_0
							dataRecord[1] = [];//result  -1
							dataRecord[2] = [];//result  -2
							dataRecord[3] = [];//result  -3
							dataRecord[4] = [];//result  -4
							dataRecord[5] = [];//result  -5
							dataRecord[6] = [];//result  -6
							dataRecord[7] = [];//result  -7
						}
						else if(time_reference!=strDateTime)
						{
							//new time 
							dataRecord[0].push(dataStructor.result_0);
							dataRecord[1].push(dataStructor.result_1);
							dataRecord[2].push(dataStructor.result_2);
							dataRecord[3].push(dataStructor.result_3);
							dataRecord[4].push(dataStructor.result_4);
							dataRecord[5].push(dataStructor.result_5);
							dataRecord[6].push(dataStructor.result_6);
							dataRecord[7].push(dataStructor.result_7);
							timeRecord.push(hour);
							//timeRecord.push( (new Date(time_reference)).getHours() );
							time_reference = strDateTime;
							dataStructor = {
								result_0:0
								,result_1:0
								,result_2:0
								,result_3:0
								,result_4:0
								,result_5:0
								,result_6:0
								,result_7:0
							};
						}

						
						var act_result = isNaN(Number(_value['act_result']))?0:Number(_value['act_result']);
						var result_s = _value['result'];//isNaN(Number(_value['result']))?0:Number(_value['result']);
						if('0'==result_s){dataStructor.result_0 = act_result;}
						else if('-1'==result_s){dataStructor.result_1 = act_result;}
						else if('-2'==result_s){dataStructor.result_2 = act_result;}
						else if('-3'==result_s){dataStructor.result_3 = act_result;}
						else if('-4'==result_s){dataStructor.result_4 = act_result;}
						else if('-5'==result_s){dataStructor.result_5 = act_result;}
						else if('-6'==result_s){dataStructor.result_6 = act_result;}
						else if('-7'==result_s){dataStructor.result_7 = act_result;}
					});
					
					res.data = dataRecord;
					res.xData = timeRecord;
				}
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
	//		logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

exports.query_cloundCidList = function(args,isCheckUser,context)
{
	var thisObj = this;
	if(context)
	{
		thisObj=context;
	}
	var res = {};
	res.data = [];
	res.result = "success";
	var mysql ="";
	if(!isCheckUser){
		var sess = validate(this.req);
	}
	
	if (isCheckUser || sess) 
	{
		mysql ="select id,ch_name,remarks,ch_del from chid_table";
		var beginQueryTime = new Date().getTime();
		db.query(mysql, function(err, rows) {		
			res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) 
			{
				if (!rows.length) {
					res.result = "zero";
				}else{
					var i = 0;
					res.data[i++] = ['0', "other",'其他'];
					rows.forEach(function( _value ) {
						if( 0 == Number(_value['ch_del']) ){        			
							res.data[i++] = [_value['id'], _value['ch_name'],_value['remarks']];
						}
					});
				}
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
	//		logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

exports.query_cloundCidAdd = function(args)
{
	var thisObj = this;
	var ch_name = args["ch_name"];
	var ch_remarks = args["ch_remarks"];
	
	var res = {};
	res.data = [];
	res.result = "success";
	var mysql ="";
	var sess = validate(this.req);
	if (sess) 
	{
		if(ch_name)
		{
			mysql = "insert into chid_table set ch_name='"+ch_name+"', remarks ='"+ch_remarks+"'";
		}else{
			res.result = "failed";
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
			return;
		}
		db.query(mysql, function(err, rows) {	
			if (!err) 
			{
				require("./mainFrame.js").query_cloundCidList(args,true,thisObj);
				return;
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
//			logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};

exports.query_cloundCidDel = function(args)
{
	var thisObj = this;
	//var ch_name = args["ch_name"];
	var id = args["id"];
	
	var res = {};
	res.data = [];
	res.result = "success";
	var mysql ="";
	var sess = validate(this.req);
	if (sess) 
	{
		mysql ="update chid_table set ch_del=1 where id="+id;
		var beginQueryTime = new Date().getTime();	
		db.query(mysql, function(err, rows) {		
		res.queryTime = new Date().getTime() - beginQueryTime;
			if (!err) 
			{
				require("./mainFrame.js").query_cloundCidList(args,true,thisObj);
				return;
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
//			logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
};
exports.query_cloundCidUpdate = function(args)
{
	var thisObj = this;
	var res = {};
	res.data = [];
	res.result = "success";
	
	var mysql ="";
	var sess = validate(this.req);
	if (sess) 
	{
		for(var keys in this.req.post)
		{
			mysql += util.format('update chid_table set remarks="%s" where id=%s;',this.req.post[keys]['备注'],keys);
		}
	
		var beginQueryTime = new Date().getTime();	
		db.query(mysql, function(err, rows) {		
		res.queryTime = new Date().getTime() - beginQueryTime;
	//		console.log( "result:"+JSON.stringify(rows)+" : "+JSON.stringify(err) );
			require("./mainFrame.js").query_cloundCidList(args,true,thisObj);
			return;
			if (!err) 
			{
				//require("./mainFrame.js").query_cloundCidList(args,true,thisObj);
				//return;
			}
			else{
				logs.logger.error("query query_upgrade_version: "+err);
				res.result = "failed";
			}
	//		logs.logger.info("result:"+JSON.stringify( res ));
			thisObj.responseDirect(200, "text/json", JSON.stringify(res));
		});
	}else{
		res.result = "expired";
		thisObj.responseDirect(200, "text/json", JSON.stringify(res));
	}
}