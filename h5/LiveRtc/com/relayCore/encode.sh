#压缩文件
tmpClass_=()
bl_=()
nbl_=()
function encode()
{
	file=""
	fileName=$1
	rm -f $fileName
	all_=($@)
	unset all_[0]
	for i in ${all_[@]}
	do
		echo "processFile->$i"
		#标记注释
		zsstart=false
		#标记函数
		funstart=false
		knum=0
		while read -r line
		do
			tmp=$line
			#查找类命名空间
			g=$( expr "$tmp" : '.*\.ns("\(.*\)").*' )
			if [ "$g" ]; then
				hasClass_=false
				for i in ${tmpClass_[@]}
				do
					if [ "$i" = "$g" ]; then
						hasClass_=true
						break
					fi
				done
				if $hasClass_; then
					continue
				fi
				len_=${#tmpClass_[@]}
				tmpClass_[$len_]=$g
				echo "新的类命名空间->$g"
			fi
			
			#查找//开头一直到结尾的注释
			a=$( expr "$tmp" : '^\(\/\{2,\}.*\)$' )
			if [ "$a" ]; then
				echo "删除整行->$tmp"
				continue
			fi
			
			#查找/**/包含的注释
			if ! $zsstart; then
				e=$( expr "$tmp" : '^\(\/\*\).*' )
			fi
			if [ "$e" ]; then
				zsstart=true
			fi
			if $zsstart; then
				f=$( expr "$tmp" : '.*\(\*\/\)$' )
				echo "注释->$tmp"
				if [ "$f" ]; then
					zsstart=false
				fi
				continue
			fi
			
			#查找//到结尾并且前面非：的注释
			b=$( expr "$tmp" : '.*[^:]\(\/\/[^"]*\)$' )
			#查找单行中/**/的注释
			c=$( expr "$tmp" : '.*\(\/\*.*\*\/\).*' )
			#查找//到结尾并且前面是：和任意字符的注释
			d=$( expr "$tmp" : '.*["A-Z0-9][:]\(\/\/[^"]*\)$' )
			if [ "$b" ]; then
				echo "删除->$b"
				tmp=${tmp%%$b}
			elif [ "$c" ]; then
				echo "删除->$c"
				tmp=${tmp//$c/}
			elif [ "$d" ]; then
				echo "删除->$d"
				tmp=${tmp%%$d}
			fi
			
			#函数
			h=$( expr "$tmp" : '.*:function(\(.*\))' )
			#},标记
			k=$( expr "$tmp" : '^\(},\)$' )
			
			if [ "$h" ]; then
				bl_=(${h//,/ })
				nbl_=()
				#函数开始
				funstart=true
				echo "函数开始， 参数：${bl_[@]}"
			fi
			if $funstart; then
				if [ "$k" ]; then
					funstart=false
					echo "函数结束"
				fi
				###############################
				#内部变量提取
				in=$( expr "$tmp" : '^var \([a-zA-Z0-9_,]\{1,\}\).*' )
				if [ "$in" ]; then
					len_=${#nbl_[@]}
					if [ "$len_" -eq 0 ]; then
						nbl_=(${in//,/ })
					else
						nbl_=("${nbl_[@]}" ${in//,/ })
					fi
				fi
				#替换变量
				for((i=0;i<${#nbl_[@]};i++));
				do
					var="b"$i"_"
					if [ "$i" -eq 0 ]; then
						var="b_"
					fi
					tmp=${tmp//${nbl_[$i]}/$var}
				done
				###############################
				#替换变量，匹配变量
				#echo "$tmp"
				for((i=0;i<${#bl_[@]};i++));
				do
					var="_a"$i
					if [ "$i" -eq 0 ]; then
						var="_a"
					fi
					tmp=${tmp//${bl_[$i]}/$var}
				done
				#echo "$tmp"
			fi
			echo "$tmp" >> $fileName
			#替换内部变量
			
		done < $i
	done
}
encode vo.js  broadcast/BroadCast.js