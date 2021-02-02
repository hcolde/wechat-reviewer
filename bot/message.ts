import { Message } from "wechaty";
import { getLogger } from "log4js";

import { personalMessage } from "./message/personal";

const logger = getLogger();

export async function onMessage(message: Message) {
    // console.log(message.from()?.name());
    // console.log(message.from()?.weixin());
    // console.log(message.from()?.type());
    // console.log(message.type());
    // console.log(message.text());
    // console.log("======================");
    // console.log();

    // 群消息
    if (message.room()) {
        return;
    }

    // 个人消息
    personalMessage(message);
}
