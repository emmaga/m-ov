# m-ov
###安装说明
####1.安装nodejs
####2.安装grunt
    打开终端，输入npm install grunt-cli -g安装。
####3.安装项目所需node modules文件
    在终端的当前项目目录下，输入npm install 进行本地安装，等待安装完毕即可。
####4.首页地址说明
#####1.商城首页地址示例
######1.多门店商城
	https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxeae127ff98a4c844&redirect_uri=http://openvoddev.cleartv.cn/wx/index.html%23/shopHome&response_type=code&scope=snsapi_base&state=jfsc&component_appid=wxc6e8a3fab4f25a4f#wechat_redirect
######2.仅显示单门店商城
	https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxeae127ff98a4c844&redirect_uri=http://openvoddev.cleartv.cn/wx/index.html%23/shopHome&response_type=code&scope=snsapi_base&state=shop,jfsc;hotelId,35&component_appid=wxc6e8a3fab4f25a4f#wechat_redirect
#####1.商城订单地址示例
	https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxeae127ff98a4c844&redirect_uri=http://openvoddev.cleartv.cn/wx/index.html%23/shopOrderList&response_type=code&scope=snsapi_base&state=123&component_appid=wxc6e8a3fab4f25a4f#wechat_redirect