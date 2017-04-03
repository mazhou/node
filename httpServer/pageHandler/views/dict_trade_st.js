var dictTrade_selectList = [ 
//[id,label,title]
//[id,label]
];

var dictTrade_list_head = ["id","所属的券商","券商的登录帐号","券商的登录密码","最大额度","最大数量","买入比例","拆分数","操作"];//"操作"单加按钮
var dictTrade_list_body = [
//"USERID","TRADEID","ACCOUNTID","PASSWORD","MAXBUY","BUYAMOUNT","BUYPERCENT","SPLITCOUNT"
//btn[name,value,id+'_dict']
];

var dictTrade_record = null;

// $('<input></input>',{
// 				'type':'checkbox'
// 				,'name':checkValue[checkId][0]
// 				,'value':checkValue[checkId][1]
// 				,'checked':checkValue[checkId][2]==0?false:true
// 			}).appendTo(tmp_label);

var dictTrade_selectElement = null;
var getRecord_dt_list = function(TRADEID,ACCOUNTID){
	if(dictTrade_list_body.length>0){
		for(var i = 0; i < dictTrade_list_body.length; i++){
			if(dictTrade_list_body[i]['TRADEID']==TRADEID && dictTrade_list_body[i]['ACCOUNTID']==ACCOUNTID){
				return dictTrade_list_body[i];
			}
		}
	}
}
var getRecord_dt_selectList = function(TRADEID){
	if(dictTrade_selectList.length>0){
		for(var i =0; i< dictTrade_selectList.length; i++){
			if( dictTrade_selectList[i][0]==TRADEID ){
				return dictTrade_selectList[i][1];
			}
		}
	}
}

var delete_dictTrade_Account = function(){
	console.log('delete_dictTrade_Account',arguments)
	var sendData = {
        TRADEID:arguments[0]
        ,ACCOUNTID:arguments[1]
    };

    $.ajax({
        type:"post",
        url:"/delete_userAccount",
        async:false,
        dataType:"json",
        data:sendData,
        success:function(data,textStatus){
            if(data.success){
            	load_dictTrade_info(); 
            }
        },
        beforeSend: function(xhr){
            xhr.withCredentials = true;
        }
    });
}

var modify_dictTrade_Account = function(){
	
	// ???改为竖式处理，记录原始数据，并清空表单
	// var sendData = {
 //        tradeid:arguments[0]
 //        ,accountid:arguments[1]
 //        ,password:arguments[2]
 //    };

    var sendData = {
    	TRADEID:dictTrade_selectElement.val()
        ,ACCOUNTID:$("#dictTrade_account").val()
        ,PASSWORD:$("#dictTrade_pwd").val()
        // ,PASSWORD:$("#dictTrade_pwd").val()
        ,MAXBUY:$("#dictTrade_MAXBUY").val()
        ,BUYAMOUNT:$("#dictTrade_BUYAMOUNT").val()
        ,BUYPERCENT:$("#dictTrade_BUYPERCENT").val()
        ,SPLITCOUNT:$("#dictTrade_SPLITCOUNT").val()
    }

    $.ajax({
        type:"post",
        url:"/modify_userAccount",
        async:false,
        dataType:"json",
        data:sendData,
        success:function(data,textStatus){
            
            if(data.success){
                load_dictTrade_info(); 
            }
        },
        beforeSend: function(xhr){
            xhr.withCredentials = true;
        }
    });

}

var add_dictTrade_Account = function(){
	console.log(arguments)

	var sendData = {
        TRADEID:dictTrade_selectElement.val()
        ,ACCOUNTID:$("#dictTrade_account").val()
        ,PASSWORD:$("#dictTrade_pwd").val()
        ,MAXBUY:$("#dictTrade_MAXBUY").val()
        ,BUYAMOUNT:$("#dictTrade_BUYAMOUNT").val()
        ,BUYPERCENT:$("#dictTrade_BUYPERCENT").val()
        ,SPLITCOUNT:$("#dictTrade_SPLITCOUNT").val()
    };
    console.log("add_dictTrade_Account",JSON.stringify(sendData))
    $.ajax({
        type:"post",
        url:"/add_userAccount",
        async:false,
        dataType:"json",
        data:sendData,
        success:function(data,textStatus){
            if(data.success){
            	load_dictTrade_info();
            }
        },
        beforeSend: function(xhr){
            xhr.withCredentials = true;
        }
    });
}

var reset_dictTrade_Account = function(){
	$("#dictTrade_account").val('');
	$("#dictTrade_pwd").val('');
	dictTrade_selectElement.val(0)
}

var dictTrade_clickHandler = function(){
	
	if(this.type == "submit"){
		// $.confirm({
		//     title: 'Confirm!',
		//     content: 'Simple confirm!',
		//     buttons: {
		//         confirm: function () {
		//             $.alert('Confirmed!');
		//         },
		//         cancel: function () {
		//             $.alert('Canceled!');
		//         },
		//         somethingElse: {
		//             text: 'Something else',
		//             btnClass: 'btn-blue',
		//             keys: ['enter', 'shift'],
		//             action: function(){
		//                 $.alert('Something else?');
		//             }
		//         }
		//     }
		// });
		
		if(this.textContent == "删除"){
			var r = confirm("确定删除帐号!");
			if (r == true) {
			    delete_dictTrade_Account(this.value,this.id.replace("_dict",""));
			} else {
			    
			}
			// console.log(this.id,this.name,this.value);
		}else if(this.textContent == "修改"){

			console.log(　'id',this.id,'name', this.name, 'value',this.value);
			$('#dictTrade_list_body').hide();
			append_dictTrade_modify(this.value, this.id.replace("_dict","") );
			
		// }else if(this.textContent == "提交"){
		// 	var r = confirm("确定修改密码!");
		// 	if (r == true) {
		// 	    txt = "You pressed OK!";
		// 	} else {
		// 	    txt = "You pressed Cancel!";
		// 	}

		// 	console.log(txt);
		// 	console.log(this.id,this.name,this.value);
		// 	console.log($('#'+this.id.replace("_dict","_pwd")).val());
			// var pwd = "";
			// modify_dictTrade_Account(this.value,this.id.replace("_dict",""),pwd);
		// }else if(this.textContent == "返回"){
		// 	console.log(this.id,this.name,this.value);

		// 	append_dictTrade_list();
		// 	// $('#dictTrade_add').show();
		// 	$('#dictTrade_list_body').show();

		}
	}else if(this.type == "button"){
		if(this.value == "新增"){
			var r = confirm("请检查信息填写是否正确");
			if (r == true) {
			    add_dictTrade_Account();
			} 

			// console.log("select",$("#dictTrade_account").val());
			// console.log("select",$("#dictTrade_pwd").val());
			// console.log("select",dictTrade_selectElement.val());
			
		}else if(this.value == "提交"){
			modify_dictTrade_Account();
		}else if(this.value == "重置"){
			console.log(this.name)
			reset_dictTrade_Account();
		}else if(this.value == "返回"){
			init_addvalue();
			append_dictTrade_list();
			$('#dictTrade_list_body').show();
		}
	}
}

var init_addvalue = function(){
	$("#dictTrade_account").val(Math.ceil(2147483647*Math.random()));
	$("#dictTrade_pwd ").val('12345678');
	// $("#dictTrade_MAXBUY").val(Number.MAX_VALUE);
	$("#dictTrade_MAXBUY").val(2147483647);
	// $("#dictTrade_BUYAMOUNT").val(Number.MAX_VALUE);
	$("#dictTrade_BUYAMOUNT").val(2147483647);
	$("#dictTrade_BUYPERCENT").val('0.5');
	$("#dictTrade_SPLITCOUNT").val('1');
}

var init_modifyvalue = function(record)
{
	//"USERID","TRADEID","ACCOUNTID","PASSWORD","MAXBUY","BUYAMOUNT","BUYPERCENT","SPLITCOUNT"
	// $("#dictTrade_account").val(record['TRADEID']);
	dictTrade_selectElement.val(record['TRADEID'])
	$("#dictTrade_account").val(record['ACCOUNTID']);
	$("#dictTrade_pwd ").val(record['PASSWORD']);
	$("#dictTrade_MAXBUY").val(record['MAXBUY']);
	$("#dictTrade_BUYAMOUNT").val(record['BUYAMOUNT']);
	$("#dictTrade_BUYPERCENT").val(record['BUYPERCENT']);
	$("#dictTrade_SPLITCOUNT").val(record['SPLITCOUNT']);
}



var start_dictTrade_Page = function(){
	$("#user_account_submit").click(
		dictTrade_clickHandler
	);

	$("#user_account_reset").click(
		dictTrade_clickHandler
	);

	init_addvalue();
	if(dictTrade_selectList.length==0){
		$.ajax({
	        type:"get",
	        url:"/select_dictTrade",
	        async:false,
	        dataType:"json",
	        success:function(data,textStatus){
	            if(data.success){
	            	dictTrade_selectList = [];
	            	for(var i in data.data){
	            		dictTrade_selectList.push([data.data[i]["ID"],data.data[i]["NAME"]]);
	            	}
	            	create_dictTrade_Select();
	            	load_dictTrade_info();
	            }
	        },
	        beforeSend: function(xhr){
	            xhr.withCredentials = true;
	        }
	    });
	}else{
		load_dictTrade_info();
	}
}


var create_dictTrade_Select=function(){
	
	dictTrade_selectElement = $('<select></select>',{
		id:'dictTrade_select'
	})

	for(var sId = 0; sId < dictTrade_selectList.length; sId++)
	{
		if( 3 <= dictTrade_selectList[sId].length )
		{
			if(dictTrade_selectList[sId][2])
			{
				dictTrade_selectElement.append("<option value='"
					+dictTrade_selectList[sId][0]
					+"' title='"+dictTrade_selectList[sId][2]+"'>"+dictTrade_selectList[sId][1]+"</option>");
			}else{
				dictTrade_selectElement.append("<option value='"
					+dictTrade_selectList[sId][0]+"'>"
					+dictTrade_selectList[sId][1]+"</option>");
			}
			
		}else if( 2 == dictTrade_selectList[sId].length )
		{
			dictTrade_selectElement.append("<option value='"
				+dictTrade_selectList[sId][0]+"'>"+dictTrade_selectList[sId][1]+"</option>");
		}
	}

	// dictTrade_selectElement.val("maxMem");

	$("#dict_trade_opt").append(dictTrade_selectElement);
}

var append_dictTrade_modify = function( TRADEID, ACCOUNTID ){
	//"USERID","TRADEID","ACCOUNTID","PASSWORD","MAXBUY","BUYAMOUNT","BUYPERCENT","SPLITCOUNT"
	var record =  getRecord_dt_list(TRADEID,ACCOUNTID);
	console.log("append_dictTrade_modify",JSON.stringify(record));
	$('#dict_trade_lab').text('修改帐号');
	$('#user_account_submit').val('提交');
	$('#user_account_submit').name = '123';
	$('#user_account_reset').val('返回');
	init_modifyvalue(record);
	

	// $("#dictTrade_list_body").empty();
	// var tb = $('<table></table>', {
	// 	'id': "dictTrade_list_body_tb",
	// 	'class':'display dataTable'
	// }).appendTo($('#dictTrade_list_body'));
	// var thead = $('<thead></thead>').appendTo(tb);
	// var tr = $('<tr></tr>').appendTo(thead);
	
	// for(var elm = 0; elm < dictTrade_list_head.length; elm++){
	// 	var th = $('<th></th>',
	// 	{class:"ui-state-default"
	// 	}).appendTo(tr).text(dictTrade_list_head[elm]);
	// }

	// var tbody = $('<tbody></tbody>').appendTo(tb);
	// var tr = $('<tr></tr>',{class:"odd"}).appendTo(tbody);
	// $('<td></td>').appendTo(tr).text(0);
	// $('<td></td>').appendTo(tr).text(getRecord_dt_selectList(TRADEID));
	// $('<td></td>').appendTo(tr).text(ACCOUNTID);
	// $('<td></td>').appendTo(tr).append($('<input type="text" id="'+(ACCOUNTID+"_pwd")+'" value="" />'));
	// $('<td></td>').appendTo(tr).append($('<input type="text" id="'+(MAXBUY+"_pwd")+'" value="" />'));
	// $('<td></td>').appendTo(tr).append($('<input type="text" id="'+(BUYAMOUNT+"_pwd")+'" value="" />'));
	// $('<td></td>').appendTo(tr).append($('<input type="text" id="'+(BUYPERCENT+"_pwd")+'" value="" />'));
	// $('<td></td>').appendTo(tr).append($('<input type="text" id="'+(SPLITCOUNT+"_pwd")+'" value="" />'));
	// var td = $('<td></td>').appendTo(tr);
				
	// var button = $('<button></button>',{
	// 	'id':ACCOUNTID+"_dict",
	// 	// 'name':dictTrade_list_body[elm][0],
	// 	'value':TRADEID,
	// 	'text':'提交'
	// }).click(dictTrade_clickHandler);
	// td.append(button);
	// var button = $('<button></button>',{
	// 		'id':ACCOUNTID+"_dict",
	// 		// 'name':dictTrade_list_body[elm][0],
	// 		'value':TRADEID,
	// 		'text':'返回'
	// }).click(dictTrade_clickHandler);
	// td.append(button);

}

var append_dictTrade_list = function(){
	$("#dictTrade_list_body").empty();
	var tb = $('<table></table>', {
		'id': "dictTrade_list_body_tb",
		'class':'display dataTable'
	}).appendTo($('#dictTrade_list_body'));

	var thead = $('<thead></thead>').appendTo(tb);
	var tr = $('<tr></tr>').appendTo(thead);
	
	for(var elm = 0; elm < dictTrade_list_head.length; elm++){
		var th = $('<th></th>',
		{class:"ui-state-default"
		}).appendTo(tr).text(dictTrade_list_head[elm]);
	}

	var tbody = $('<tbody></tbody>').appendTo(tb);
	
	for(var elm = 0; elm < dictTrade_list_body.length; elm++){
		var tr=null;
		if(elm%2==0){
			tr = $('<tr></tr>',{class:"odd"}).appendTo(tbody);
		}else{
			tr = $('<tr></tr>',{class:"even"}).appendTo(tbody);
		}

		$('<td></td>').appendTo(tr).text(elm);
		$('<td></td>').appendTo(tr).text(getRecord_dt_selectList(dictTrade_list_body[elm]['TRADEID']));
		$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm]['ACCOUNTID']);
		$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm]['PASSWORD']);
		$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm]['MAXBUY']);
		$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm]['BUYAMOUNT']);
		$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm]['BUYPERCENT']);
		$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm]['SPLITCOUNT']);
		var td = $('<td></td>').appendTo(tr);
		var button = $('<button></button>',{
					'id':dictTrade_list_body[elm]['ACCOUNTID']+"_dict",
				'name':dictTrade_list_body[elm]['USERID'],
				'value':dictTrade_list_body[elm]['TRADEID'],
				'text':'删除'
			}).click(dictTrade_clickHandler);
		td.append(button);
		var button = $('<button></button>',{
				'id':dictTrade_list_body[elm]['ACCOUNTID']+"_dict",
				'name':dictTrade_list_body[elm]['USERID'],
				'value':dictTrade_list_body[elm]['TRADEID'],
				'text':'修改'
			}).click(dictTrade_clickHandler);
		td.append(button);



		// for(var inElm=0; inElm <= dictTrade_list_body[elm].length; inElm++){
		// 	if(inElm == dictTrade_list_body[elm].length){
		// 		var td = $('<td></td>').appendTo(tr);
		// 		//"USERID","TRADEID","ACCOUNTID","PASSWORD","MAXBUY","BUYAMOUNT","BUYPERCENT","SPLITCOUNT"

	 //   			var button = $('<button></button>',{
	 //   					'id':dictTrade_list_body[elm]['ACCOUNTID']+"_dict",
		// 				'name':dictTrade_list_body[elm]['USERID'],
		// 				'value':dictTrade_list_body[elm]['TRADEID'],
		// 				'text':'删除'
		// 			}).click(dictTrade_clickHandler);
		// 		td.append(button);
		// 		var button = $('<button></button>',{
		// 				'id':dictTrade_list_body[elm]['ACCOUNTID']+"_dict",
		// 				'name':dictTrade_list_body[elm]['USERID'],
		// 				'value':dictTrade_list_body[elm]['TRADEID'],
		// 				'text':'修改'
		// 			}).click(dictTrade_clickHandler);
		// 		td.append(button);
		// 	}else{
		// 		 if(inElm == 0){
		// 		 	$('<td></td>').appendTo(tr).text(elm);
		// 		}else if(inElm == 1){
		// 			$('<td></td>').appendTo(tr).text( getRecord_dt_selectList(dictTrade_list_body[elm]['TRADEID']) );
		// 		}else{
		// 			$('<td></td>').appendTo(tr).text(dictTrade_list_body[elm][inElm]);
		// 		}
		// 	}
		// }
	}

	show_dictTrade_Page();
}

var show_dictTrade_Page = function(){
	$("#dict_trade_panel").show();
}

var load_dictTrade_info = function(){
	$.ajax({
	    type:"get",
	    url:"/select_userAccount",
	    async:false,
	    dataType:"json",
	    success:function(data,textStatus){
	        
	        if(data.success){
	        	console.log(data.data);
	        	dictTrade_list_body = [];
	        	for(var i=0; i<data.data.length; i++){
	        		dictTrade_list_body.push(data.data[i]);
	        	}
	        }
	        append_dictTrade_list();
	    },
	    beforeSend: function(xhr){
	        xhr.withCredentials = true;
	    }
	});
	// var progressBar = document.getElementById("p"),
	// var client = new XMLHttpRequest();
	// client.open("GET", "select_userAccount");
	// client.setRequestHeader("Content-Type", "text/json;charset=UTF-8");
	// client.onprogress = function(pe) {
	// 	if(pe.lengthComputable) {
	//  		progressBar.max = pe.total
	//  		progressBar.value = pe.loaded
	// 	}
	// }
	// client.onloadend = function(pe) {
	// 	progressBar.value = pe.loaded
	// }
	// client.send()
}

oojs$.addEventListener("ready",function(){
	start_dictTrade_Page();
})

