import { Contact, FileBox, Message, Wechaty } from "wechaty";
import { getLogger } from "log4js";

import { wechaty } from "../../index"
import { Redis } from "../../redis/redis";
import { getTransID, getPay } from "./pay";
import config from "../../config/config.json";

const logger = getLogger();
const redis  = new Redis();

const help  = `[让我看看]请输入数字：\n【1】充值\n【2】查看余额\n【3】开通会员\n【4】查看会员到期时间\n【5】查看会员功能\n【6】联系管理员`
const help2 = `[让我看看]请输入数字：\n【31】1天体验会员(1元)\n【32】31天月度会员(25元)\n【33】93天季度会员(60元)\n【34】372天年度会员(200元)`
const help3 = `[耶]会员功能包括：\n1.群消息广告内容识别\n2.群消息色情内容识别\n3.群消息暴恐内容识别\n4.群消息涉政内容识别\n5.自动踢出/警告违规群成员\n具体操作可将机器人拉入群聊，然后在群聊中输入\"帮助\"获取详情`

export function personalMessage(message: Message) {
    let wx = message.from()?.weixin();

    switch (message.type()) {
        // 扫描收款码
        case Message.Type.Recalled:
            getTransID(message.text());
            break;

        case Message.Type.Url:
            if (wx == "wxzhifu") {
                // 完成收款
                getPay(message.text());
            }
            break;

        // 文本消息
        case Message.Type.Text:
            personal(message);

        default:
            break;
    }
}

function personal(message: Message) {
    let from = message.from();
    if (from == null) {
        message.say("无法获取消息来源[衰]\n若需要联系管理员请输入6[握手]");
        return;
    }

    switch (message.text()) {
        case config.pad_local.owner_pass:
            redis.set(config.redis.key.owner, from.id);
            message.say("绑定成功");
            break;

        case "帮助":
            message.say(help);
            break;

        // 充值 => 发送收款二维码
        case "1":
            sendReceiveQRCode(from);
            break;

        // 查看余额
        case "2":
            checkBalance(from);
            break;

        // 开通会员
        case "3":
            joinVIP(from);
            break;

            case "31":
            case "32":
            case "33":
            case "34":
                joinVIP2(from, message.text());
                break

        // 查看会员到期时间
        case "4":
            queryVIPTime(from);
            break;

        case "5":
            message.say(help3);
            break;

        case "6":
            sendOwnerCard(from);
            break;

        default:
            message.say("您可以输入\"帮助\"来查询您想要的信息噢[抱拳]")
            break;
    }
}

function sendReceiveQRCode(contact: Contact) {
    let fileBox = FileBox.fromFile("config/receiveQRCode.jpeg");
    contact.say(fileBox);
}

async function checkBalance(contact: Contact) {
    let money = await getMoney(contact.id);
    contact.say(`[哇]您的余额为：${money}元`);
}

async function getMoney(id: string):Promise<number> {
    let result = await redis.hmget(config.redis.key.member, id);
    if (result.length <= 0) {
        return 0;
    }

    let moneyStr = result[0];
    if (moneyStr == null) {
        return 0;
    }
    return parseFloat(moneyStr);
}

async function joinVIP(contact: Contact) {
    contact.say(help2);
}

async function joinVIP2(contact: Contact, text:string) {
    let ing = await redis.get(`${contact.id}_vip`);
    if (ing == "0") {
        contact.say("正在为您开通会员，请不要重复操作哟[皱眉]");
    }

    let pay = 0;
    let msg = "";

    switch (text) {
        case "31":
            pay = 1;
            msg = "1天体验会员";
            break;

        case "32":
            pay = 25;
            msg = "31天月度会员";
            break;

        case "33":
            pay = 60;
            msg = "93天季度会员";
            break;

        case "34":
            pay = 200;
            msg = "372天年度会员";
            break;

        default:
            return;
    }

    let money = await getMoney(contact.id);
    if (money < pay) {
        contact.say("抱歉您的余额不足，请充值[嘿哈]");
        return;
    }
    contact.say(`正在为您开通${msg}[嘿哈]\n开通成功后我会提示您，请耐心等待[愉快]`);

    redis.set(`${contact.id}_vip`, "1", 60);
    msg = `{"wxid":"${contact.id}","money":${pay}}`;
    redis.lpush(config.redis.key.vip_list, msg);
    logger.info(msg);
}

async function queryVIPTime(contact: Contact) {
    let vip = await redis.hmget(config.redis.key.vip, contact.id);
    let msg = "您未开通会员或会员已过期";
    if (vip != null && vip.length > 0 && vip[0] != null) {
        let date = new Date(Number(vip[0]) * 1000);
        msg = `您的会员到期时间为：\n${date.getFullYear()}年${date.getMonth()}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    }

    contact.say(msg)
}

async function sendOwnerCard(contact: Contact) {
    let wxid = await redis.get(config.redis.key.owner)
    if (wxid == null) {
        contact.say("该机器人暂未绑定管理员，输入密令，让我做您的妲己[害羞]");
        return;
    }
    let c = wechaty.Contact.load(wxid.toString())
    contact.say(c)
}
