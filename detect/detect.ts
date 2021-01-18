import {getCut} from "./cut"

const detectMap = new Map();

export function add(msg: string) {
    detectMap.set(msg, true);
}

export function del(msg: string): string {
    if (detectMap.delete(msg)) {
        return `已删除敏感词【${msg}】`;
    }
    return `未找到敏感词【${msg}】`;
}

export function detect(msg: string): string {
    let wechat = detectWechat(msg);
    let phone = detectPhone(msg);
    let text = detectText(msg);
    if (wechat != "" && (phone != "" || text != "")) wechat += "\n";
    if (phone != "" || text != "") phone += "\n";
    return wechat + phone + text;
}

function detectText(msg: string): string {
    let result = [];
    let words = getCut(msg);
    if (words == null || words.length <= 0) return "";
    for (let i = 0; i < words.length; i++) {
        if (detectMap.has(words[i])) {
            result.push(`【${words[i]}】`);
        }
    }
    if (result.length > 0) {
        return `检测到敏感词:${result.toString()}`;
    }
    return "";
}

function detectWechat(msg: string): string {
    let pattern = /[a-zA-Z_]{1}[a-zA-Z\d_-]{5,19}/g;
    let result = msg.match(pattern);
    if (result) {
        return `检测到微信号:【${result.toString()}】`;
    }
    return "";
}

function detectPhone(msg: string): string {
    let mobile = detectMobile(msg);
    let unicom = detectUnicom(msg);
    let telecom = detectTelecom(msg);
    if (mobile != "" && (unicom != "" || telecom != "")) mobile += "\n";
    if (unicom != "" && telecom != "") unicom += "\n";
    return mobile + unicom + telecom;
}

function detectMobile(msg: string): string {
    let pattern = /13[4|5|6|7|8|9][0-9]{8}|14[4|7|8][0-9]{8}|15[0|1|2|7|8|9][0-9]{8}|165[0-9]{8}|170[3|5|6][0-9]{7}|178[0-9]{8}|18[2|3|4|7|8][0-9]{8}|198[0-9]{8}/g;
    let result = msg.match(pattern);
    if (result) {
        return `检测到移动号码:【${result.toString()}】`;
    }
    return "";
}

function detectUnicom(msg: string): string {
    let pattern = /13[0|1|2][0-9]{8}|14[0|5|6][0-9]{8}|15[5|6][0-9]{8}|16[6|7][0-9]{8}|170[4|7|8|9][0-9]{7}|171[0-9]{8}|175[0-9]{8}|176[0-9]{8}|18[5|6][0-9]{8}/g;
    let result = msg.match(pattern);
    if (result) {
        return `检测到联通号码:【${result.toString()}】`;
    }
    return "";
}

function detectTelecom(msg: string): string {
    let pattern = /133[0-9]{8}|1349[0-9]{7}|14[1|9][0-9]{8}|153[0-9]{8}|170[0|1|2][0-9]{7}|1740[0-9]{7}|173[0-9]{8}|177[0-9]{8}|18[0|1|9][0-9]{8}|19[1|9][0-9]{8}/g;
    let result = msg.match(pattern);
    if (result) {
        return `检测到电信号码:【${result.toString()}】`;
    }
    return "";
}
