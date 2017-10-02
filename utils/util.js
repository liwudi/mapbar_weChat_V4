let WxService = require('../service/WxService');
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

function getNowDate(s = new Date().getTime()) {
    let day = new Date(s);
    let [Year,Month,Day,Hour,Minute,CurrentDate] = [0,0,0,0,0,``]
    Year = day.getFullYear();
    Month = day.getMonth() + 1;
    Day = day.getDate();
    Hour = day.getHours();
    Minute = day.getMinutes();
    if (Month >= 10) {
        CurrentDate += `${Month}-`;
    } else {
        CurrentDate += `0${Month}-`;
    }
    if (Day >= 10) {
        CurrentDate += `${Day}`;
    } else {
        CurrentDate += `0${Day}`;
    }
    if (Hour >= 10) {
        CurrentDate += ` ${Hour}:`;
    } else {
        CurrentDate += ` 0${Hour}:`;
    }
    if (Minute >= 10) {
        CurrentDate += `${Minute}`;
    } else {
        CurrentDate += `0${Minute}`;
    }
    return CurrentDate;
}

function dealCatch(callback,next){
  WxService.getNetworkType().then(res => {
    console.log('获取的网络状态', res);
    if (res !== 'none') {
      callback();
    } else {
      next && next();
      !next && wx.showToast({
        title: '请检查您的网络问题',
        icon: 'loading',
        duration: 2000
      })
    }
  })
}
function dealTime(time) {
  let isNumber = true;
  let arr = [];
  let item = '';
  for (let i = 0; i < time.length; i++) {
    let index = time.charCodeAt(i);
    console.log(index);
    if (47 < index && index < 58) {
      if (isNumber == true) {
        item += time[i]
      }
      if (isNumber == false) {
        arr.push(item);
        item = '';
        item += time[i]
      }
      isNumber = true;
    } else {
      if (isNumber == false) {
        item += time[i]
      }
      if (isNumber == true) {
        arr.push(item);
        item = '';
        item += time[i]
      }
      isNumber = false;
    }
  }
  arr.push(item);
  return arr;
}
module.exports = {
  systemInfo,
  getNowDate,
  dealCatch,
  dealTime
}