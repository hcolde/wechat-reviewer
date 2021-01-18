import {cutAll} from "nodejieba"
import {transverter} from "../translate/transverter"

export function getCut(str: string): string[] | null {
    // 去除空格
    str = str.replace(/\s/g, "");
    // 去除非中英文符号
    let res = str.match(/[\u4E00-\u9FA5 | a-zA-Z]/g);
    if (res == null) return null;
    
    let chinese = res.join("");
    chinese = transverter(chinese, {"type":"simplified", "language":"zh_TW"});
    return cutAll(chinese);
}