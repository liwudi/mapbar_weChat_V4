//app service
const BaseService = require(`./BaseService`);

const WxService = require(`./WxService`);

const Promise = require(`../vendor/bluebird/bluebird`);

const Config = require(`../config`);

let userInfo = {
    "userId": "",
    "userName": "",
    "userImg": "",
    "userPhone": null,
    "totalDistance": 0,
    "cityName": "",
    "totalCitys": 0,
    "maxDistance": 0,
    "openStatus": 0,
    "creatTime": 1490687160000,
    "updateTime": 1490921126000,
    "id": 1240,
}

userInfo = wx.getStorageSync('userInfo');

let userName,userImg,userId;

if(!!userInfo){

    userId = userInfo.userId;

    userName = userInfo.userName;

    userImg = userInfo.userImg;

}
function setUserInfo(userInfo){
    wx.setStorageSync('userInfo',userInfo)
}
function getUserInfo(){
    return WxService.wxCheckSession().then(() => {
        //不调用code，进行登录
        if(userInfo&&userId&&userName&&userImg){
            console.log(`再次登陆`)
            return WxService.wxUserInfo().then(res => {
              userInfo.userImg = res.userInfo.avatarUrl;
              setUserInfo(userInfo);
            }).then(()=>{
              return getGroupList()
            }).catch((err)=>{
              return getGroupList()
            })
            
        }else{
          //调用code的情况进行登录
            return WxService.wxLogin().then((res) => {
                console.log(`首次登陆${res.code}`)
                return WxService.wxUserInfo().then((data) => {
                    
                    data.code = res.code;
                    console.log('data',data);
                    return data;
                })
            }).then((res) => {
                console.log(res)
                return getUserId(res.code,res.userInfo.avatarUrl,res.userInfo.nickName);
            })
        }
    }).catch(() => {
        //session验证过期，重新code进行登录
        return WxService.wxLogin().then((res) => {
            
            return WxService.wxUserInfo().then((data) => {
              console.log('data', data);
                data.code = res.code;
                return data;
            })
        }).then((res) => {
            return getUserId(res.code,res.userInfo.avatarUrl,res.userInfo.nickName);
        })
    });
}
/**
 * 登录接口，通过code进行获取用户信息
 */
function getUserId(code, avatarUrl, nickName){
    console.log('code',code);
    return BaseService.get(
        `${Config.main_url}/wxGroup/login.json`,
        {
            code,
            userimg:avatarUrl,
            username:nickName,
        }
    ).then(res => {  
        setUserInfo(res.data.user);
        return res;
    })
}
/**
 * 登录接口，通过缓存，调用登录接口获取用户信息里面。
 */
function getGroupList(){
    return BaseService.get(
        `${Config.main_url}/wxGroup/login.json`,
        {
            userid: userInfo.userId,
            username: userInfo.userName,
            userimg: userInfo.userImg,
        }
    ).then(res => {    
        setUserInfo(res.data.user);
        return res;
    })
}
//获取用户列表，通过groupId和isOver
function getUsersList(groupId,pram){
    return BaseService.get(
        `${Config.main_url}/wxGroup/searchTrip.json?groupid=${groupId}&isOver=${pram}`,
        {}
    )
}

//系统相关数据

let systemInfo = {
    "model":"iPhone 6",
    "pixelRatio":2,
    "windowWidth":320,
    "windowHeight":528,
    "system":"iOS 10.0.1",
    "language":"zh_CN",
    "version":"6.3.9",
    "platform":"devtools"
};

wx.getSystemInfo({
    success: (res) => {
        systemInfo = res;
    }
});

function pushSms(userId,phoneNum){
    return BaseService.get(
        `${Config.main_url}/wxGroup/pushSms.json`,
        {
            userId,
            phoneNum
        }
    )
}

function upLoadPin(userid,code_value){
    return BaseService.get(
      `${Config.main_url}/wxGroup/uploadPin.json`,
      {
        pin:code_value,
        userid: userid
      }
    )
}

function nav(data){
    return BaseService.get(
        `${Config.main_url}/wxGroup/getDrive.json`,
        Object.assign({
            userid: userInfo.userId
        }, data)
    )
}

function upLoadLonlat(data){
    
    return BaseService.get(
        `${Config.main_url}/wxGroup/updateLoc.json`,
        Object.assign({
            userid: userInfo.userId
        }, data)
    )
}

//获取城市code相关

let cityCode = {
    time: ``,
    code: ``,
    currentCity: ``,
}

function getCityCode(){
    let now = new Date().getTime();
    //接口调用优化。1分钟之内，默认调用上次获取的cityCode
    if(cityCode.time &&  (now - cityCode.time < 60*1000)){
        return new Promise((resolve,reject) => {
            resolve(cityCode);
        })
    }else{
      return WxService.getLocation().then(res => {
          return BaseService.get(
            `${Config.cityCode_url}/opentsp/gis/api/inverse?resType=json&lat=${res.latitude}&lon=${res.longitude}&inGb=02&outGb=g02&ak=69453725f7e942bb84eac04189fd20ab`,
              {}
          )
      }).then(res => {
        cityCode = {
          time: now,
          code: res.data.province.code,
          currentCity: res.data.city.value,
        }
        return cityCode;
      })
    }
    
}


//search相关\

function commonSearch(keywords,location,city,page_num){
    return BaseService.get(
      `${Config.search_url}`,
        {
            keywords,
            location,
            city,
            page_num
        }
    )
}

function keywordsSearch(keywords,location,city,page_num) {
    return BaseService.get(
      `${Config.search_url}/keywords`,
        {
            keywords,
            location,
            city,
            page_num
        }
    )
}

function suggestSearch(keywords,cityCode){
    return BaseService.get(
      `${Config.search_url}/suggest`,
        {
            'keywords': keywords,
            'city':cityCode
        }
    )
}

function aroundSearch(keywords,location,city,page_num){
    return BaseService.get(
      `${Config.search_url}/around`,
        {
            keywords,
            location,
            city,
            page_num
        }
    )
}

//群组跟新相关

function createGroup(userid,groupname,lon,lat,destname){
    
    BaseService.get(
        `${Config.main_url}/wxGroup/createGroup.json`,
        {
            userid,
            groupname,
            lon,
            lat,
            destname
        }
    ).then(res => {
        wx.hideToast();
        WxService.redirectTo(`../destination/destination?groupId=${res.data.groupid}&isGroupHost=true&lat=${lat}&lon=${lon}`);
    })
}

function exitTheGroup(userId,groupId){
    BaseService.get(
    `${Config.main_url}/wxGroup/updateGroup.json`,
    {
        userid:userId,
        groupid:groupId,
        status:1
    }
    ).then(res => {
        wx.navigateBack({delta: 5});
        if(res.status == 200){
            
        }
    }).catch(error => {
        console.log(error);
    });
}

function changeGroupName(userId,groupId,groupname){
    BaseService.get(
    `${Config.main_url}/wxGroup/updateGroup.json`,
    {
        userid:userId,
        groupid:groupId,
        groupname:groupname
    }
    ).then(res => {
        wx.navigateBack({delta: 1});
        if(res.status == 200){
            
        }
    }).catch(error => {
        console.log(error);
    });
}



//语音相关
function voice_search(groupId,pageSize,pageIndex){
    return BaseService.get(
        `${Config.voice_url}/voiceByGroup?groupid=${groupId}&pageSize=${pageSize}&pageIndex=${pageIndex}`,
        {}
    )
}

function connectVoice(){
    return BaseService.get(
        `${Config.voice_url}/webSocketCode?userid=${userInfo.userId}`,
        {}
    ).then(res => {
        console.log(`语音通道`,res);
        let webSocketCode = res.data.data.message;
        let i = 0;
        WxService.connectSocket(webSocketCode,i);
    })
}
function closeSocket(){
    wx.closeSocket();
}


module.exports = {
    getUserId: getUserId,
    getUserInfo,
    getGroupList,
    getUsersList,
    pushSms,
    nav,
    upLoadLonlat,
    upLoadPin,
    systemInfo,
    getCityCode,

    suggestSearch,
    commonSearch,
    keywordsSearch,
    aroundSearch,

    createGroup,
    exitTheGroup,
    changeGroupName,

    voice_search,
    connectVoice,
    closeSocket,

}





/**
 * @个人理解：1、作为一个服务，我们应该在它底层实现过期时间的验证。
 * 2、http请求是最常见的服务，在一个项目中，service目录之外不应该出现接口地址。
 * 3、config.js一般作为一个全局配置而存在，里面的东西通常是不变的，可以配置域名，文件目录等等。
 * 4、服务的目录应该清晰，AppService应该是和接口相关的服务，而WxService应该是微信自己提供的api接口的封装，BaseService应该只提供基本的get和post请求。
 * 
 */