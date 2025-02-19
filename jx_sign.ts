/**
 * 任务、宝箱
 * TODO 助力
 */

import axios from 'axios';
import * as path from "path";
import {requireConfig, wait, requestAlgo, h5st, exceptCookie} from './TS_USER_AGENTS';

let cookie: string = '', res: any = '', USER_AGENT = "jdpingou;", UserName: string, index: number;

!(async () => {
  await requestAlgo();
  let cookiesArr: any = await requireConfig();
  let except: string[] = exceptCookie(path.basename(__filename));

  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    index = i + 1;
    console.log(`\n开始【京东账号${index}】${UserName}\n`);

    if (except.includes(encodeURIComponent(UserName))) {
      console.log('已设置跳过')
      continue
    }

    try {
      res = await api('query', 'signhb_source,smp,type', {signhb_source: 5, smp: '', type: 1})
      for (let t of res.commontask) {
        if (t.status === 1) {
          console.log(t.taskname)
          res = await api(`https://m.jingxi.com/fanxiantask/signhb/dotask?task=${t.task}&signhb_source=5&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`, '')
          if (res.ret === 0) {
            console.log('任务完成，获得：', res.sendhb)
          } else {
            console.log('任务失败：', res.errmsg)
          }
          await wait(3000)
        }
      }

      res = await api('query', 'signhb_source,smp,type', {signhb_source: 5, smp: '', type: 1})
      if (res.baoxiang_left != 0) {
        for (let t of res.baoxiang_stage) {
          if (t.status === 1) {
            res = await api(`https://m.jingxi.com/fanxiantask/signhb/bxdraw?_=${Date.now()}&sceneval=2`, '')
            console.log('开宝箱，获得：', res.sendhb)
            await wait(3000)
          }
        }
      }
    } catch (e: any) {
      console.log(e)
    }
    await wait(3000)
  }
})()

interface Params {
  signhb_source?: number,
  type?: number,
  smp?: string,
}

function api(fn: string, stk: string, params: Params = {}) {
  return new Promise(async (resolve, reject) => {
    let url = `https://m.jingxi.com/fanxiantask/signhb/${fn}?_stk=${encodeURIComponent(stk)}&_ste=1&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`
    url = h5st(url, stk, params, 10038)
    if (fn.match(/(dotask|bxdraw)/)) {
      url = fn
    }
    try {
      let {data}: any = await axios.get(url, {
        headers: {
          'Host': 'm.jingxi.com',
          'User-Agent': USER_AGENT,
          'Referer': 'https://st.jingxi.com/',
          'X-Requested-With': 'com.jd.pingou',
          'Cookie': cookie,
        }
      })
      if (typeof data === 'string') {
        data = data.replace('try{jsonpCBKB(', '').replace('try{Query(', '').replace('try{BxDraw(', '').split('\n')[0]
        resolve(JSON.parse(data))
      } else {
        resolve(data)
      }
    } catch (e: any) {
      reject(401)
    }
  })
}
