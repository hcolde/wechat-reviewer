var parser = require('fast-xml-parser');

import { getLogger } from "log4js";

import { Redis } from "../../redis/redis";
import config from "../../config/config.json";

const logger = getLogger();
const redis  = new Redis();

// 建立transID与wxid的联系
export function getTransID(text: string){
    let transID = "";
    let result = text.match(/<outtradeno>.*<\/outtradeno>/);
    if (result != null) {
        result = result[0].match(/[\d]+/);
        if (result != null)
            transID = result[0];
    }

    if (transID == "") {
        logger.error("could not match transID");
        return;
    }
    if( parser.validate(text) !== true) {
        logger.error("could not parse xml to json,and message.text():", text);
        return;
    }

    let jsonObj = parser.parse(text);
    let wxid = jsonObj.sysmsg.paymsg.username;

    logger.info(`{"transID":"${transID}","wxid":""${wxid}}`);
    redis.set(transID, wxid, config.redis.expire);
}

// 建立transID与支付金额的联系 放入队列处理
export function getPay(text: string) {
    if (parser.validate(text) !== true) {
        logger.error("could not parse xml to json,and message.text():", text);
        return;
    }

    let pay = "";
    let transID = "";

    let jsonObj = parser.parse(text);
    let url = jsonObj.msg.appmsg.url;
    let word = jsonObj.msg.appmsg.mmreader.template_detail.line_content.topline.value.word;
    let result = word.match(/[\d]+\.*[\d]*/);
    if (result != null)
        pay = result[0];

    if (pay == "") {
        logger.error("could not get pay info from word,and word:", word);
        return;
    }

    result = url.match(/trans_id=[\d]+/);
    if (result != null) {
        result = result[0].match(/[\d]+/);
        if (result != null)
            transID = result[0];
    }

    if (transID == "") {
        logger.error("could not match transID from url,and url is:", url);
        return;
    }

    let msg = `{"trans_id":"${transID}","money":${pay}}`;
    logger.info(msg)
    redis.lpush(config.redis.key.pay_list, msg);
}