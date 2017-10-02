//wx service
/**
 * @ 1、微信服务
 * @ 2、loading
 * @ 3、Modal相关
 * @ 4、exception相关
 */

//exception可能出现的情况。1、网络异常。2、wx接口异常。3、服务器异常。4、自身代码异常
const Promise = require(`../vendor/bluebird/bluebird`);

const Config = require(`../config`);

const BaseService = require(`./BaseService`);
//@ 1、微信服务
let wxLogin = () => {
    return new Promise((resolve, reject) => {
        wx.login({
            success: function(res){
                if(res.code){
                    resolve(res);
                }else{
                    reject(res);
                }
            },
            fail:reject
        })
    })
}

let _currentLatLon = {}

let setCurrentLatLon = (currentLatLon) => {
    _currentLatLon = currentLatLon;
}

let getCurrentLatLon = () => {
    return _currentLatLon;
}

let wxUserInfo = () =>{
    return new Promise((resolve, reject) => {
        wx.getUserInfo({
            success: resolve,
            fail: reject
        })
    })
}

let wxCheckSession = () => {
    console.log(`wxCheckSession`)
    return new Promise((resolve,reject) => {
        wx.checkSession({
            success: function(e){
                console.log(e);
                resolve(1);
            },
            fail: reject
        })
    })
} 

let currentPoint = {}

let getLocation = () => {
    return new Promise((resolve, reject) => {
        if(currentPoint.time && (new Date().getTime() - currentPoint.time < 6*1000)){
            resolve(currentPoint);
        }else{
            wx.getLocation({
                type: `gcj02`, 
                success: (res) => {
                    res.time = new Date().getTime();
                    currentPoint = res;
                    resolve(res);
                },
                fail: (err) => {
                  reject(err);
                  showSetModal('地理位置');
                }
            })
        }
        
    })
}

let navigateTo = (url,success,fail) => {
    wx.navigateTo({
      url: url,
      success: function(res){
        success&&success(res);
      },
      fail: function() {
        fail&&fail();
      },
      complete: function() {
        // complete
      }
    })
}

let redirectTo = (url,success,fail) => {
    wx.redirectTo({
      url: url,
      success: function(res){
        success&&success(res)
      },
      fail: function() {
        fail&&fail();
      }
    })
}



let startRecord = () => {
    return new Promise((resolve, reject) => {
        wx.startRecord({
          success: resolve,
          fail: function(err){
            reject(err);
            getNetworkType().then(res => {
              if (res !== 'none') {
                showSetModal('录音功能');
              } else {
                /**
                 * @info: 如果网络有问题，就给出提示信息
                 */
                wx.showToast({
                  title: '请检查您的网络问题',
                  icon: 'loading',
                  duration: 2000
                })
              }
            })
          }
        })
    })
}

let saveFile = (tempFilePath) => {
    return new Promise((resolve,reject) => {
        wx.saveFile({
          tempFilePath: tempFilePath,
          success: function(res){
            resolve(res);
          },
          fail: reject
        })
    })
}

let connectSocket = (webSocketCode,i = 0) => {
    return new Promise((resolve,reject) => {
        wx.connectSocket({
          url: `${Config.voice_socket_url}/websocket?socketCode=${webSocketCode}`,
          data: {},
          header: {
              'content-type': 'application/json'
          },
          method: 'POST',
          success: function(){
            // wx.showToast({
            //     title: '语音通道建立成功！',
            //     icon: 'success',
            //     duration: 2000
            // })
          },
          fail: function(){
            if(i > 5){
                return
            }
            connectSocket(webSocketCode,++i);
          }
        })
    })
}

let upLoadFile = (savedFilePath,userid,groupid,timelong) => {
    return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${Config.voice_url}/voiceUp`,
          filePath: savedFilePath,
          name:'content',
          // header: {}, // 设置请求的 header
          formData: {
            userid,
            groupid,
            timelong
          }, 
          success: function(res){
            console.log("上传语音成功");
          }
        })
    })
}

let downloadFile = (audio_id) => {
    return new Promise((resolve,reject) => {
        wx.downloadFile({
            url: `${Config.voice_url}/voiceById?id=${audio_id}`, 
            success: function(res) {
                resolve(res);
                
            },
            fail: reject
        })
    })
}

let onmessageSocket = () => {
    return new Promise((resolve,reject) => {
        wx.onSocketMessage(function(data) {
            resolve(data);
        })
    })
    
}
//获取网络类型
let getNetworkType = () => {
  return new Promise((resolve,reject) => {
    wx.getNetworkType({
      success: function (res) {
        // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
        var networkType = res.networkType
        resolve(networkType);
      },
      fail: reject
    })
  })
}
//判断当前网络连接问题
//在网络不通的情况下，会间断性的提示网络异常。
//在网络切换的情况下，会告知网络切换情况。但不再切换网络，就不提示切换
let onNetworkStatusChange = () => {
  wx.onNetworkStatusChange(function (res) {
    let isConnected = res.isConnected;
    let networkType = res.networkType;
    !isConnected && showModal('网络异常','您当前的网络未连接',false);
    isConnected && showToast('网络切换成'+networkType,"success");
  })
}

/**
 * @introduction:界面交互相关
 */

//提示授权问题
let showSetModal = (title) => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: `请确认${title}授权开启`,
      content: '1、点击右上角“...”，进入关于图吧界面   2、再点击右上角“...”打开授权设置界面',
      confirmText: '知道了',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          resolve(res.confirm)
        }
      }
    })
  })
}
let isShowModal = false;
//弹窗设置
let showModal = (title, content, isShowCancel, next) => {
  !isShowModal && (isShowModal = true) && wx.showModal({
    title: title,
    content: content,
    showCancel: isShowCancel,
    success: function (res) {
      if (res.confirm) {
        next && next();
        isShowModal = false
      }
    }
  })
}

//提示加载
let showLoading = (title,isMask) => {
  wx.showLoading({
    title: title || '加载中',
    mask: isMask || true,
  });
}

let hideLoading = () => {
  wx.hideLoading();
}

let showToast = (title,icon,duration) => {
  wx.showToast({
    title: title || '',
    icon: icon || 'loading',
    duration: duration || 2000
  })
}

module.exports = {
    wxLogin,
    wxCheckSession,
    wxUserInfo,
    getLocation,
    navigateTo,
    redirectTo,
    showModal,
    showSetModal,

    startRecord,
    saveFile,

    connectSocket,
    onmessageSocket,
    
    upLoadFile,
    downloadFile,

    getNetworkType,

    showToast,
    showLoading,
    hideLoading,
    //网络监控
    onNetworkStatusChange,
}