var qrcode = require("qrcode-terminal");

import { ScanStatus } from "wechaty";
import { getLogger } from "log4js";

import config from "../config/config.json";

const logger = getLogger();

export function onScan(code: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting && code) {
        qrcode.generate(code);
    } else {
        logger.info(config.pad_local.name, `onScan: ${ScanStatus[status]}(${status})`);
    }
}
