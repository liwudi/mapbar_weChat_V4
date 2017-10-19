//app.js

let common = require('./utils/util');
let WxService = require('./service/WxService');
let AppService = require('./service/AppService');

App({
    onLaunch: function () {
      WxService.onNetworkStatusChange();
    },
    onHide: function () {
        wx.getSavedFileList({
            success: function(res) {
                //console.log(res);
                if (res.fileList.length > 0){
                wx.removeSavedFile({
                    filePath: res.fileList[0].filePath,
                    complete: function(res) {
                    //console.log(res)
                    }
                })
                }
            }
        });
    },
    globalData: {
        isInit:false,
        userInfo: {},
        isAutoPlay: true,
    }
});

