import {PuppetPadlocal} from "wechaty-puppet-padlocal";
import {Contact, Friendship, Message, ScanStatus, Wechaty} from "wechaty";

import {Redis} from "./redis/redis"
import {sendQRCode} from "./mail/sendQRCode"
import {detect, add, del} from "./detect/detect"
import {getCut} from "./detect/cut"
import config from "./config/config.json"

enum botType {
    Normal = 0,
    OnlyDetect,
    DetectNKick,
}

const token: string = config.pad_local.token
const puppet = new PuppetPadlocal({ token })

const bot = new Wechaty({
    name: config.pad_local.name,
    puppet,
})

const redis = new Redis()

let owner: string = ""
let bt = botType.Normal

bot
.on("scan", (qrcode: string, status: ScanStatus) => {
    if (status === ScanStatus.Waiting && qrcode) {
        const qrcodeImageUrl = ["https://api.qrserver.com/v1/create-qr-code/?data=", encodeURIComponent(qrcode)].join("");
        sendQRCode(qrcodeImageUrl);
        console.log(`onScan: ${ScanStatus[status]}(${status}) - ${qrcodeImageUrl}`);
    } else {
        console.log(`onScan: ${ScanStatus[status]}(${status})`);
    }
})

.on("login", async (user: Contact) => {
    // 与主人的前世今生
    let res = await redis.get(config.redis.key.owner);
    if (res != null) owner = res.toString();

    // 认清自己的现状
    res = await redis.get(config.redis.key.status);
    if (res != null) bt = Number(res);

    if (owner != "") {
        let o = await bot.Friendship.search({weixin: owner});
        if (o != null) {
            o.say("I am coming!");
        }
    }
})

.on("logout", (user: Contact) => {
    console.log(`${user} logout`);
})

.on("friendship", async friendship => {
    if (friendship.type() == bot.Friendship.Type.Receive) {
        try {
            await friendship.accept();
        } catch (e) {
            console.log(e);
        }
    }
})

// 自动接受入群邀请
.on('room-invite', async roomInvitation => {try {await roomInvitation.accept()} catch (e) {}})

.on("message", async (message: Message) => {
    const contact = message.from();
    if (contact == null) return;

    const text = message.text();
    const room = message.room();
    let msg :string = "";
    if (room) {
        if (contact.id == owner) { // 主子发话
            let index = text.indexOf("- - - - - - - - - - - - - - -");
            if (index != -1) { // 引用
                let quote = text.substr(0, index).replace(/\s/g, "").match(/「.*?：(.*)」/);
                if (quote == null) {
                    msg = "exm?";
                } else {
                    let res = getCut(quote[1]);
                    if (res == null) {
                        msg = "exm??";
                    } else {
                        let map = {};
                        for (let i = 0; i < res.length; i++) {
                            map[`S${i+1}`] = res[i];
                            msg += `[S${i+1}]${res[i]}`;
                            if (i < res.length - 1) msg += "\n";
                        }
                        redis.hmset(config.redis.key.sensitive + room.id, map, config.redis.expire);
                    }
                    if (msg != "") msg = "请输入括号中的代码添加屏蔽词\n" + msg;
                }
            } else if (text[0] == "S") { // 添加敏感词汇
                let res = await redis.hmget(config.redis.key.sensitive + room.id, text);
                if (res == null || res.length <= 0 || res[0] == null) {
                    msg = "没有数据!";
                } else {
                    add(res[0]);
                    msg = `已将【${res[0]}】标记为敏感词`;
                }
            } else if (text[0] == "DS") { // 删除敏感词汇
                let word = text.substr(2, text.length - 2);
                msg = del(word);
            }
        } else if (bt != botType.Normal) { // 闲杂人等叽叽歪歪
            if (message.type() == bot.Message.Type.Text) {
                let result = detect(text);
                if (bt == botType.OnlyDetect) {
                    if (result != "") {
                        msg = `@${contact.name()}\n请不要发布广告\n${result}`;
                    }
                } else if (bt == botType.DetectNKick) {
                    try {
                        msg = `@${contact.name()}\n检测到广告，自动踢出群聊\n${result}`;
                        room.del(contact);
                    } catch(e) {
                        msg = `@${contact.name()}\n检测到广告，却无法踢出群聊！！！\n${result}`;
                        console.log(e);
                    }
                }
            } else if (message.type() == bot.Message.Type.Contact) {
                if (bt == botType.OnlyDetect) {
                    msg = `@${contact.name()}\n请不要发名片，有发广告嫌疑噢`;
                } else if (bt == botType.DetectNKick) {
                    try {
                        msg = `@${contact.name()}\n检测到发名片，自动踢出群聊`;
                        room.del(contact);
                    } catch(e) {
                        msg = `@${contact.name()}\n检测到发名片，却无法踢出群聊！！！`;
                    }
                }
            }
        }
    } else {
        if (text == config.pad_local.owner_pass) { // 认主子
            owner = contact.id;
            redis.set(config.redis.key.owner, owner)
            msg = "绑定成功";
        } else if (contact.id == owner) { // 主子发话
            if (text == "help") {
                msg = "输入括号中的数字\n";
                for (let i = 0; i < config.pad_local.help.length; i++) {
                    msg += `【${i}】${config.pad_local.help[i]}`;
                    if (i < config.pad_local.help.length - 1) msg += "\n";
                }
            } else if (Number(text) >= 0 && Number(text) < config.pad_local.help.length) {
                bt = Number(text);
                redis.set(config.redis.key.status, text);
                msg = `切换状态:${config.pad_local.help[bt]}`;
            } else if (text == "state") {
                msg = `当前状态:${config.pad_local.help[bt]}`;
            }
        }

        if (msg == "") { // 对话
        }
    }
    if (msg != "") message.say(msg);
})

.start()

console.log(config.pad_local.name, "started");
