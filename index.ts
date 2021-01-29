var fs = require('fs');

import {Wechaty} from "wechaty";
import { configure, getLogger } from "log4js";
import {PuppetPadlocal} from "wechaty-puppet-padlocal";

import { onScan } from "./bot/scan";
import { onMessage } from "./bot/message";
import config from "./config/config.json";

if (!fs.existsSync(config.log.path)) {
    fs.mkdirSync(config.log.path, 0o777);
}

const logger = getLogger();
configure({
    appenders: { cheese: { type: "file", filename: config.log.path + "/" + config.log.name, maxLogSize: config.log.size, backups: config.log.backups, compress: true } },
    categories: { default: { appenders: ["cheese"], level: config.log.level } }
});

let token = config.pad_local.token;
let puppet = new PuppetPadlocal({ token });
let wechaty = new Wechaty({
    name: config.pad_local.name,
    puppet,
});

wechaty.on("scan", onScan);
wechaty.on("message", onMessage);

wechaty.start().then(() => {
    logger.debug(config.pad_local.name, "started.");
});
