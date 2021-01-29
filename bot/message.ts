import { Message } from "wechaty";
import { getLogger } from "log4js";

import { getTransID, getPay } from "./message/pay";

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
    let wx = message.from()?.weixin();

    switch (message.type()) {
        // 扫描收款码
        case Message.Type.Recalled:
            getTransID(message.text())
            break;

        case Message.Type.Url:
            if (wx == "wxzhifu") {
                // 完成收款
                getPay(message.text())
            }
            break;

        default:
            break;
    }
}
