/* README: https://github.com/VirgilClyne/iRingo */
/* https://www.lodashjs.com */
class Lodash {
	static name = "Lodash";
	static version = "1.2.2";
	static about() { return console.log(`\n🟧 ${this.name} v${this.version}\n`) };

	static get(object = {}, path = "", defaultValue = undefined) {
		// translate array case to dot case, then split with .
		// a[0].b -> a.0.b -> ['a', '0', 'b']
		if (!Array.isArray(path)) path = this.toPath(path);

		const result = path.reduce((previousValue, currentValue) => {
			return Object(previousValue)[currentValue]; // null undefined get attribute will throwError, Object() can return a object 
		}, object);
		return (result === undefined) ? defaultValue : result;
	}

	static set(object = {}, path = "", value) {
		if (!Array.isArray(path)) path = this.toPath(path);
		path
			.slice(0, -1)
			.reduce(
				(previousValue, currentValue, currentIndex) =>
					(Object(previousValue[currentValue]) === previousValue[currentValue])
						? previousValue[currentValue]
						: previousValue[currentValue] = (/^\d+$/.test(path[currentIndex + 1]) ? [] : {}),
				object
			)[path[path.length - 1]] = value;
		return object
	}

	static unset(object = {}, path = "") {
		if (!Array.isArray(path)) path = this.toPath(path);
		let result = path.reduce((previousValue, currentValue, currentIndex) => {
			if (currentIndex === path.length - 1) {
				delete previousValue[currentValue];
				return true
			}
			return Object(previousValue)[currentValue]
		}, object);
		return result
	}

	static toPath(value) {
		return value.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
	}

	static escape(string) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
		};
		return string.replace(/[&<>"']/g, m => map[m])
	};

	static unescape(string) {
		const map = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#39;': "'",
		};
		return string.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m])
	}

}

/* https://developer.mozilla.org/zh-CN/docs/Web/API/Storage/setItem */
class $Storage {
	static name = "$Storage";
	static version = "1.0.9";
	static about() { return console.log(`\n🟧 ${this.name} v${this.version}\n`) };
	static data = null
	static dataFile = 'box.dat'
	static #nameRegex = /^@(?<key>[^.]+)(?:\.(?<path>.*))?$/;

	static #platform() {
		if ('undefined' !== typeof $environment && $environment['surge-version'])
			return 'Surge'
		if ('undefined' !== typeof $environment && $environment['stash-version'])
			return 'Stash'
		if ('undefined' !== typeof module && !!module.exports) return 'Node.js'
		if ('undefined' !== typeof $task) return 'Quantumult X'
		if ('undefined' !== typeof $loon) return 'Loon'
		if ('undefined' !== typeof $rocket) return 'Shadowrocket'
		if ('undefined' !== typeof Egern) return 'Egern'
	}

    static getItem(keyName = new String, defaultValue = null) {
        let keyValue = defaultValue;
        // 如果以 @
		switch (keyName.startsWith('@')) {
			case true:
				const { key, path } = keyName.match(this.#nameRegex)?.groups;
				//console.log(`1: ${key}, ${path}`);
				keyName = key;
				let value = this.getItem(keyName, {});
				//console.log(`2: ${JSON.stringify(value)}`)
				if (typeof value !== "object") value = {};
				//console.log(`3: ${JSON.stringify(value)}`)
				keyValue = Lodash.get(value, path);
				//console.log(`4: ${JSON.stringify(keyValue)}`)
				try {
					keyValue = JSON.parse(keyValue);
				} catch (e) {
					// do nothing
				}				//console.log(`5: ${JSON.stringify(keyValue)}`)
				break;
			default:
				switch (this.#platform()) {
					case 'Surge':
					case 'Loon':
					case 'Stash':
					case 'Egern':
					case 'Shadowrocket':
						keyValue = $persistentStore.read(keyName);
						break;
					case 'Quantumult X':
						keyValue = $prefs.valueForKey(keyName);
						break;
					case 'Node.js':
						this.data = this.#loaddata(this.dataFile);
						keyValue = this.data?.[keyName];
						break;
					default:
						keyValue = this.data?.[keyName] || null;
						break;
				}				try {
					keyValue = JSON.parse(keyValue);
				} catch (e) {
					// do nothing
				}				break;
		}		return keyValue ?? defaultValue;
    };

	static setItem(keyName = new String, keyValue = new String) {
		let result = false;
		//console.log(`0: ${typeof keyValue}`);
		switch (typeof keyValue) {
			case "object":
				keyValue = JSON.stringify(keyValue);
				break;
			default:
				keyValue = String(keyValue);
				break;
		}		switch (keyName.startsWith('@')) {
			case true:
				const { key, path } = keyName.match(this.#nameRegex)?.groups;
				//console.log(`1: ${key}, ${path}`);
				keyName = key;
				let value = this.getItem(keyName, {});
				//console.log(`2: ${JSON.stringify(value)}`)
				if (typeof value !== "object") value = {};
				//console.log(`3: ${JSON.stringify(value)}`)
				Lodash.set(value, path, keyValue);
				//console.log(`4: ${JSON.stringify(value)}`)
				result = this.setItem(keyName, value);
				//console.log(`5: ${result}`)
				break;
			default:
				switch (this.#platform()) {
					case 'Surge':
					case 'Loon':
					case 'Stash':
					case 'Egern':
					case 'Shadowrocket':
						result = $persistentStore.write(keyValue, keyName);
						break;
					case 'Quantumult X':
						result =$prefs.setValueForKey(keyValue, keyName);
						break;
					case 'Node.js':
						this.data = this.#loaddata(this.dataFile);
						this.data[keyName] = keyValue;
						this.#writedata(this.dataFile);
						result = true;
						break;
					default:
						result = this.data?.[keyName] || null;
						break;
				}				break;
		}		return result;
	};

    static removeItem(keyName){
		let result = false;
		switch (keyName.startsWith('@')) {
			case true:
				const { key, path } = keyName.match(this.#nameRegex)?.groups;
				keyName = key;
				let value = this.getItem(keyName);
				if (typeof value !== "object") value = {};
				keyValue = Lodash.unset(value, path);
				result = this.setItem(keyName, value);
				break;
			default:
				switch (this.#platform()) {
					case 'Surge':
					case 'Loon':
					case 'Stash':
					case 'Egern':
					case 'Shadowrocket':
						result = false;
						break;
					case 'Quantumult X':
						result = $prefs.removeValueForKey(keyName);
						break;
					case 'Node.js':
						result = false;
						break;
					default:
						result = false;
						break;
				}				break;
		}		return result;
    }

    static clear() {
		let result = false;
		switch (this.#platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Egern':
			case 'Shadowrocket':
				result = false;
				break;
			case 'Quantumult X':
				result = $prefs.removeAllValues();
				break;
			case 'Node.js':
				result = false;
				break;
			default:
				result = false;
				break;
		}		return result;
    }

	static #loaddata(dataFile) {
		if (this.isNode()) {
			this.fs = this.fs ? this.fs : require('fs');
			this.path = this.path ? this.path : require('path');
			const curDirDataFilePath = this.path.resolve(dataFile);
			const rootDirDataFilePath = this.path.resolve(
				process.cwd(),
				dataFile
			);
			const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
			const isRootDirDataFile =
				!isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
			if (isCurDirDataFile || isRootDirDataFile) {
				const datPath = isCurDirDataFile
					? curDirDataFilePath
					: rootDirDataFilePath;
				try {
					return JSON.parse(this.fs.readFileSync(datPath))
				} catch (e) {
					return {}
				}
			} else return {}
		} else return {}
	}

	static #writedata(dataFile = this.dataFile) {
		if (this.isNode()) {
			this.fs = this.fs ? this.fs : require('fs');
			this.path = this.path ? this.path : require('path');
			const curDirDataFilePath = this.path.resolve(dataFile);
			const rootDirDataFilePath = this.path.resolve(
				process.cwd(),
				dataFile
			);
			const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
			const isRootDirDataFile =
				!isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
			const jsondata = JSON.stringify(this.data);
			if (isCurDirDataFile) {
				this.fs.writeFileSync(curDirDataFilePath, jsondata);
			} else if (isRootDirDataFile) {
				this.fs.writeFileSync(rootDirDataFilePath, jsondata);
			} else {
				this.fs.writeFileSync(curDirDataFilePath, jsondata);
			}
		}
	};

}

class ENV {
	static name = "ENV"
	static version = '1.8.3'
	static about() { return console.log(`\n🟧 ${this.name} v${this.version}\n`) }

	constructor(name, opts) {
		console.log(`\n🟧 ${ENV.name} v${ENV.version}\n`);
		this.name = name;
		this.logs = [];
		this.isMute = false;
		this.isMuteLog = false;
		this.logSeparator = '\n';
		this.encoding = 'utf-8';
		this.startTime = new Date().getTime();
		Object.assign(this, opts);
		this.log(`\n🚩 开始!\n${name}\n`);
	}
	
	environment() {
		switch (this.platform()) {
			case 'Surge':
				$environment.app = 'Surge';
				return $environment
			case 'Stash':
				$environment.app = 'Stash';
				return $environment
			case 'Egern':
				$environment.app = 'Egern';
				return $environment
			case 'Loon':
				let environment = $loon.split(' ');
				return {
					"device": environment[0],
					"ios": environment[1],
					"loon-version": environment[2],
					"app": "Loon"
				};
			case 'Quantumult X':
				return {
					"app": "Quantumult X"
				};
			case 'Node.js':
				process.env.app = 'Node.js';
				return process.env
			default:
				return {}
		}
	}

	platform() {
		if ('undefined' !== typeof $environment && $environment['surge-version'])
			return 'Surge'
		if ('undefined' !== typeof $environment && $environment['stash-version'])
			return 'Stash'
		if ('undefined' !== typeof module && !!module.exports) return 'Node.js'
		if ('undefined' !== typeof $task) return 'Quantumult X'
		if ('undefined' !== typeof $loon) return 'Loon'
		if ('undefined' !== typeof $rocket) return 'Shadowrocket'
		if ('undefined' !== typeof Egern) return 'Egern'
	}

	isNode() {
		return 'Node.js' === this.platform()
	}

	isQuanX() {
		return 'Quantumult X' === this.platform()
	}

	isSurge() {
		return 'Surge' === this.platform()
	}

	isLoon() {
		return 'Loon' === this.platform()
	}

	isShadowrocket() {
		return 'Shadowrocket' === this.platform()
	}

	isStash() {
		return 'Stash' === this.platform()
	}

	isEgern() {
		return 'Egern' === this.platform()
	}

	async getScript(url) {
		return await this.fetch(url).then(response => response.body);
	}

	async runScript(script, runOpts) {
		let httpapi = $Storage.getItem('@chavy_boxjs_userCfgs.httpapi');
		httpapi = httpapi?.replace?.(/\n/g, '')?.trim();
		let httpapi_timeout = $Storage.getItem('@chavy_boxjs_userCfgs.httpapi_timeout');
		httpapi_timeout = (httpapi_timeout * 1) ?? 20;
		httpapi_timeout = runOpts?.timeout ?? httpapi_timeout;
		const [password, address] = httpapi.split('@');
		const request = {
			url: `http://${address}/v1/scripting/evaluate`,
			body: {
				script_text: script,
				mock_type: 'cron',
				timeout: httpapi_timeout
			},
			headers: { 'X-Key': password, 'Accept': '*/*' },
			timeout: httpapi_timeout
		};
		await this.fetch(request).then(response => response.body, error => this.logErr(error));
	}

	initGotEnv(opts) {
		this.got = this.got ? this.got : require('got');
		this.cktough = this.cktough ? this.cktough : require('tough-cookie');
		this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar();
		if (opts) {
			opts.headers = opts.headers ? opts.headers : {};
			if (undefined === opts.headers.Cookie && undefined === opts.cookieJar) {
				opts.cookieJar = this.ckjar;
			}
		}
	}

	async fetch(request = {} || "", option = {}) {
		// 初始化参数
		switch (request.constructor) {
			case Object:
				request = { ...option, ...request };
				break;
			case String:
				request = { ...option, "url": request };
				break;
		}		// 自动判断请求方法
		if (!request.method) {
			request.method = "GET";
			if (request.body ?? request.bodyBytes) request.method = "POST";
		}		// 移除请求头中的部分参数, 让其自动生成
		delete request.headers?.Host;
		delete request.headers?.[":authority"];
		delete request.headers?.['Content-Length'];
		delete request.headers?.['content-length'];
		// 定义请求方法（小写）
		const method = request.method.toLocaleLowerCase();
		// 判断平台
		switch (this.platform()) {
			case 'Loon':
			case 'Surge':
			case 'Stash':
			case 'Egern':
			case 'Shadowrocket':
			default:
				// 转换请求参数
				if (request.timeout) {
					request.timeout = parseInt(request.timeout, 10);
					if (this.isSurge()) ; else request.timeout = request.timeout * 1000;
				}				if (request.policy) {
					if (this.isLoon()) request.node = request.policy;
					if (this.isStash()) Lodash.set(request, "headers.X-Stash-Selected-Proxy", encodeURI(request.policy));
					if (this.isShadowrocket()) Lodash.set(request, "headers.X-Surge-Proxy", request.policy);
				}				if (typeof request.redirection === "boolean") request["auto-redirect"] = request.redirection;
				// 转换请求体
				if (request.bodyBytes && !request.body) {
					request.body = request.bodyBytes;
					delete request.bodyBytes;
				}				// 发送请求
				return await new Promise((resolve, reject) => {
					$httpClient[method](request, (error, response, body) => {
						if (error) reject(error);
						else {
							response.ok = /^2\d\d$/.test(response.status);
							response.statusCode = response.status;
							if (body) {
								response.body = body;
								if (request["binary-mode"] == true) response.bodyBytes = body;
							}							resolve(response);
						}
					});
				});
			case 'Quantumult X':
				// 转换请求参数
				if (request.policy) Lodash.set(request, "opts.policy", request.policy);
				if (typeof request["auto-redirect"] === "boolean") Lodash.set(request, "opts.redirection", request["auto-redirect"]);
				// 转换请求体
				if (request.body instanceof ArrayBuffer) {
					request.bodyBytes = request.body;
					delete request.body;
				} else if (ArrayBuffer.isView(request.body)) {
					request.bodyBytes = request.body.buffer.slice(request.body.byteOffset, request.body.byteLength + request.body.byteOffset);
					delete object.body;
				} else if (request.body) delete request.bodyBytes;
				// 发送请求
				return await $task.fetch(request).then(
					response => {
						response.ok = /^2\d\d$/.test(response.statusCode);
						response.status = response.statusCode;
						return response;
					},
					reason => Promise.reject(reason.error));
			case 'Node.js':
				let iconv = require('iconv-lite');
				this.initGotEnv(request);
				const { url, ...option } = request;
				return await this.got[method](url, option)
					.on('redirect', (response, nextOpts) => {
						try {
							if (response.headers['set-cookie']) {
								const ck = response.headers['set-cookie']
									.map(this.cktough.Cookie.parse)
									.toString();
								if (ck) {
									this.ckjar.setCookieSync(ck, null);
								}
								nextOpts.cookieJar = this.ckjar;
							}
						} catch (e) {
							this.logErr(e);
						}
						// this.ckjar.setCookieSync(response.headers['set-cookie'].map(Cookie.parse).toString())
					})
					.then(
						response => {
							response.statusCode = response.status;
							response.body = iconv.decode(response.rawBody, this.encoding);
							response.bodyBytes = response.rawBody;
							return response;
						},
						error => Promise.reject(error.message));
		}	};

	/**
	 *
	 * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
	 *    :$.time('yyyyMMddHHmmssS')
	 *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
	 *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
	 * @param {string} format 格式化参数
	 * @param {number} ts 可选: 根据指定时间戳返回格式化日期
	 *
	 */
	time(format, ts = null) {
		const date = ts ? new Date(ts) : new Date();
		let o = {
			'M+': date.getMonth() + 1,
			'd+': date.getDate(),
			'H+': date.getHours(),
			'm+': date.getMinutes(),
			's+': date.getSeconds(),
			'q+': Math.floor((date.getMonth() + 3) / 3),
			'S': date.getMilliseconds()
		};
		if (/(y+)/.test(format))
			format = format.replace(
				RegExp.$1,
				(date.getFullYear() + '').substr(4 - RegExp.$1.length)
			);
		for (let k in o)
			if (new RegExp('(' + k + ')').test(format))
				format = format.replace(
					RegExp.$1,
					RegExp.$1.length == 1
						? o[k]
						: ('00' + o[k]).substr(('' + o[k]).length)
				);
		return format
	}

	/**
	 * 系统通知
	 *
	 * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
	 *
	 * 示例:
	 * $.msg(title, subt, desc, 'twitter://')
	 * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
	 * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
	 *
	 * @param {*} title 标题
	 * @param {*} subt 副标题
	 * @param {*} desc 通知详情
	 * @param {*} opts 通知参数
	 *
	 */
	msg(title = name, subt = '', desc = '', opts) {
		const toEnvOpts = (rawopts) => {
			switch (typeof rawopts) {
				case undefined:
					return rawopts
				case 'string':
					switch (this.platform()) {
						case 'Surge':
						case 'Stash':
						case 'Egern':
						default:
							return { url: rawopts }
						case 'Loon':
						case 'Shadowrocket':
							return rawopts
						case 'Quantumult X':
							return { 'open-url': rawopts }
						case 'Node.js':
							return undefined
					}
				case 'object':
					switch (this.platform()) {
						case 'Surge':
						case 'Stash':
						case 'Egern':
						case 'Shadowrocket':
						default: {
							let openUrl =
								rawopts.url || rawopts.openUrl || rawopts['open-url'];
							return { url: openUrl }
						}
						case 'Loon': {
							let openUrl =
								rawopts.openUrl || rawopts.url || rawopts['open-url'];
							let mediaUrl = rawopts.mediaUrl || rawopts['media-url'];
							return { openUrl, mediaUrl }
						}
						case 'Quantumult X': {
							let openUrl =
								rawopts['open-url'] || rawopts.url || rawopts.openUrl;
							let mediaUrl = rawopts['media-url'] || rawopts.mediaUrl;
							let updatePasteboard =
								rawopts['update-pasteboard'] || rawopts.updatePasteboard;
							return {
								'open-url': openUrl,
								'media-url': mediaUrl,
								'update-pasteboard': updatePasteboard
							}
						}
						case 'Node.js':
							return undefined
					}
				default:
					return undefined
			}
		};
		if (!this.isMute) {
			switch (this.platform()) {
				case 'Surge':
				case 'Loon':
				case 'Stash':
				case 'Egern':
				case 'Shadowrocket':
				default:
					$notification.post(title, subt, desc, toEnvOpts(opts));
					break
				case 'Quantumult X':
					$notify(title, subt, desc, toEnvOpts(opts));
					break
				case 'Node.js':
					break
			}
		}
		if (!this.isMuteLog) {
			let logs = ['', '==============📣系统通知📣=============='];
			logs.push(title);
			subt ? logs.push(subt) : '';
			desc ? logs.push(desc) : '';
			console.log(logs.join('\n'));
			this.logs = this.logs.concat(logs);
		}
	}

	log(...logs) {
		if (logs.length > 0) {
			this.logs = [...this.logs, ...logs];
		}
		console.log(logs.join(this.logSeparator));
	}

	logErr(error) {
		switch (this.platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Egern':
			case 'Shadowrocket':
			case 'Quantumult X':
			default:
				this.log('', `❗️ ${this.name}, 错误!`, error);
				break
			case 'Node.js':
				this.log('', `❗️${this.name}, 错误!`, error.stack);
				break
		}
	}

	wait(time) {
		return new Promise((resolve) => setTimeout(resolve, time))
	}

	done(object = {}) {
		const endTime = new Date().getTime();
		const costTime = (endTime - this.startTime) / 1000;
		this.log("", `🚩 ${this.name}, 结束! 🕛 ${costTime} 秒`, "");
		switch (this.platform()) {
			case 'Surge':
				if (object.policy) Lodash.set(object, "headers.X-Surge-Policy", object.policy);
				$done(object);
				break;
			case 'Loon':
				if (object.policy) object.node = object.policy;
				$done(object);
				break;
			case 'Stash':
				if (object.policy) Lodash.set(object, "headers.X-Stash-Selected-Proxy", encodeURI(object.policy));
				$done(object);
				break;
			case 'Egern':
				$done(object);
				break;
			case 'Shadowrocket':
			default:
				$done(object);
				break;
			case 'Quantumult X':
				if (object.policy) Lodash.set(object, "opts.policy", object.policy);
				// 移除不可写字段
				delete object["auto-redirect"];
				delete object["auto-cookie"];
				delete object["binary-mode"];
				delete object.charset;
				delete object.host;
				delete object.insecure;
				delete object.method; // 1.4.x 不可写
				delete object.opt; // $task.fetch() 参数, 不可写
				delete object.path; // 可写, 但会与 url 冲突
				delete object.policy;
				delete object["policy-descriptor"];
				delete object.scheme;
				delete object.sessionIndex;
				delete object.statusCode;
				delete object.timeout;
				if (object.body instanceof ArrayBuffer) {
					object.bodyBytes = object.body;
					delete object.body;
				} else if (ArrayBuffer.isView(object.body)) {
					object.bodyBytes = object.body.buffer.slice(object.body.byteOffset, object.body.byteLength + object.body.byteOffset);
					delete object.body;
				} else if (object.body) delete object.bodyBytes;
				$done(object);
				break;
			case 'Node.js':
				process.exit(1);
				break;
		}
	}
}

var Settings$7 = {
	Switch: true
};
var Configs$3 = {
	Storefront: [
		[
			"AE",
			"143481"
		],
		[
			"AF",
			"143610"
		],
		[
			"AG",
			"143540"
		],
		[
			"AI",
			"143538"
		],
		[
			"AL",
			"143575"
		],
		[
			"AM",
			"143524"
		],
		[
			"AO",
			"143564"
		],
		[
			"AR",
			"143505"
		],
		[
			"AT",
			"143445"
		],
		[
			"AU",
			"143460"
		],
		[
			"AZ",
			"143568"
		],
		[
			"BA",
			"143612"
		],
		[
			"BB",
			"143541"
		],
		[
			"BD",
			"143490"
		],
		[
			"BE",
			"143446"
		],
		[
			"BF",
			"143578"
		],
		[
			"BG",
			"143526"
		],
		[
			"BH",
			"143559"
		],
		[
			"BJ",
			"143576"
		],
		[
			"BM",
			"143542"
		],
		[
			"BN",
			"143560"
		],
		[
			"BO",
			"143556"
		],
		[
			"BR",
			"143503"
		],
		[
			"BS",
			"143539"
		],
		[
			"BT",
			"143577"
		],
		[
			"BW",
			"143525"
		],
		[
			"BY",
			"143565"
		],
		[
			"BZ",
			"143555"
		],
		[
			"CA",
			"143455"
		],
		[
			"CD",
			"143613"
		],
		[
			"CG",
			"143582"
		],
		[
			"CH",
			"143459"
		],
		[
			"CI",
			"143527"
		],
		[
			"CL",
			"143483"
		],
		[
			"CM",
			"143574"
		],
		[
			"CN",
			"143465"
		],
		[
			"CO",
			"143501"
		],
		[
			"CR",
			"143495"
		],
		[
			"CV",
			"143580"
		],
		[
			"CY",
			"143557"
		],
		[
			"CZ",
			"143489"
		],
		[
			"DE",
			"143443"
		],
		[
			"DK",
			"143458"
		],
		[
			"DM",
			"143545"
		],
		[
			"DO",
			"143508"
		],
		[
			"DZ",
			"143563"
		],
		[
			"EC",
			"143509"
		],
		[
			"EE",
			"143518"
		],
		[
			"EG",
			"143516"
		],
		[
			"ES",
			"143454"
		],
		[
			"FI",
			"143447"
		],
		[
			"FJ",
			"143583"
		],
		[
			"FM",
			"143591"
		],
		[
			"FR",
			"143442"
		],
		[
			"GA",
			"143614"
		],
		[
			"GB",
			"143444"
		],
		[
			"GD",
			"143546"
		],
		[
			"GF",
			"143615"
		],
		[
			"GH",
			"143573"
		],
		[
			"GM",
			"143584"
		],
		[
			"GR",
			"143448"
		],
		[
			"GT",
			"143504"
		],
		[
			"GW",
			"143585"
		],
		[
			"GY",
			"143553"
		],
		[
			"HK",
			"143463"
		],
		[
			"HN",
			"143510"
		],
		[
			"HR",
			"143494"
		],
		[
			"HU",
			"143482"
		],
		[
			"ID",
			"143476"
		],
		[
			"IE",
			"143449"
		],
		[
			"IL",
			"143491"
		],
		[
			"IN",
			"143467"
		],
		[
			"IQ",
			"143617"
		],
		[
			"IS",
			"143558"
		],
		[
			"IT",
			"143450"
		],
		[
			"JM",
			"143511"
		],
		[
			"JO",
			"143528"
		],
		[
			"JP",
			"143462"
		],
		[
			"KE",
			"143529"
		],
		[
			"KG",
			"143586"
		],
		[
			"KH",
			"143579"
		],
		[
			"KN",
			"143548"
		],
		[
			"KP",
			"143466"
		],
		[
			"KR",
			"143466"
		],
		[
			"KW",
			"143493"
		],
		[
			"KY",
			"143544"
		],
		[
			"KZ",
			"143517"
		],
		[
			"TC",
			"143552"
		],
		[
			"TD",
			"143581"
		],
		[
			"TJ",
			"143603"
		],
		[
			"TH",
			"143475"
		],
		[
			"TM",
			"143604"
		],
		[
			"TN",
			"143536"
		],
		[
			"TO",
			"143608"
		],
		[
			"TR",
			"143480"
		],
		[
			"TT",
			"143551"
		],
		[
			"TW",
			"143470"
		],
		[
			"TZ",
			"143572"
		],
		[
			"LA",
			"143587"
		],
		[
			"LB",
			"143497"
		],
		[
			"LC",
			"143549"
		],
		[
			"LI",
			"143522"
		],
		[
			"LK",
			"143486"
		],
		[
			"LR",
			"143588"
		],
		[
			"LT",
			"143520"
		],
		[
			"LU",
			"143451"
		],
		[
			"LV",
			"143519"
		],
		[
			"LY",
			"143567"
		],
		[
			"MA",
			"143620"
		],
		[
			"MD",
			"143523"
		],
		[
			"ME",
			"143619"
		],
		[
			"MG",
			"143531"
		],
		[
			"MK",
			"143530"
		],
		[
			"ML",
			"143532"
		],
		[
			"MM",
			"143570"
		],
		[
			"MN",
			"143592"
		],
		[
			"MO",
			"143515"
		],
		[
			"MR",
			"143590"
		],
		[
			"MS",
			"143547"
		],
		[
			"MT",
			"143521"
		],
		[
			"MU",
			"143533"
		],
		[
			"MV",
			"143488"
		],
		[
			"MW",
			"143589"
		],
		[
			"MX",
			"143468"
		],
		[
			"MY",
			"143473"
		],
		[
			"MZ",
			"143593"
		],
		[
			"NA",
			"143594"
		],
		[
			"NE",
			"143534"
		],
		[
			"NG",
			"143561"
		],
		[
			"NI",
			"143512"
		],
		[
			"NL",
			"143452"
		],
		[
			"NO",
			"143457"
		],
		[
			"NP",
			"143484"
		],
		[
			"NR",
			"143606"
		],
		[
			"NZ",
			"143461"
		],
		[
			"OM",
			"143562"
		],
		[
			"PA",
			"143485"
		],
		[
			"PE",
			"143507"
		],
		[
			"PG",
			"143597"
		],
		[
			"PH",
			"143474"
		],
		[
			"PK",
			"143477"
		],
		[
			"PL",
			"143478"
		],
		[
			"PT",
			"143453"
		],
		[
			"PW",
			"143595"
		],
		[
			"PY",
			"143513"
		],
		[
			"QA",
			"143498"
		],
		[
			"RO",
			"143487"
		],
		[
			"RS",
			"143500"
		],
		[
			"RU",
			"143469"
		],
		[
			"RW",
			"143621"
		],
		[
			"SA",
			"143479"
		],
		[
			"SB",
			"143601"
		],
		[
			"SC",
			"143599"
		],
		[
			"SE",
			"143456"
		],
		[
			"SG",
			"143464"
		],
		[
			"SI",
			"143499"
		],
		[
			"SK",
			"143496"
		],
		[
			"SL",
			"143600"
		],
		[
			"SN",
			"143535"
		],
		[
			"SR",
			"143554"
		],
		[
			"ST",
			"143598"
		],
		[
			"SV",
			"143506"
		],
		[
			"SZ",
			"143602"
		],
		[
			"UA",
			"143492"
		],
		[
			"UG",
			"143537"
		],
		[
			"US",
			"143441"
		],
		[
			"UY",
			"143514"
		],
		[
			"UZ",
			"143566"
		],
		[
			"VC",
			"143550"
		],
		[
			"VE",
			"143502"
		],
		[
			"VG",
			"143543"
		],
		[
			"VN",
			"143471"
		],
		[
			"VU",
			"143609"
		],
		[
			"XK",
			"143624"
		],
		[
			"YE",
			"143571"
		],
		[
			"ZA",
			"143472"
		],
		[
			"ZM",
			"143622"
		],
		[
			"ZW",
			"143605"
		]
	]
};
var Default = {
	Settings: Settings$7,
	Configs: Configs$3
};

var Default$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs$3,
	Settings: Settings$7,
	default: Default
});

var Settings$6 = {
	Switch: true,
	PEP: {
		GCC: "US"
	}
};
var Location = {
	Settings: Settings$6
};

var Location$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$6,
	default: Location
});

var Settings$5 = {
	Switch: true,
	UrlInfoSet: {
		Dispatcher: "AutoNavi",
		Directions: "AutoNavi",
		RAP: "Apple",
		LocationShift: "AUTO"
	},
	TileSet: {
		"Map": "CN",
		Satellite: "HYBRID",
		Traffic: "CN",
		POI: "CN",
		Flyover: "XX",
		Munin: "XX"
	},
	GeoManifest: {
		Dynamic: {
			Config: {
				CountryCode: {
					"default": "CN",
					iOS: "AUTO",
					iPadOS: "AUTO",
					watchOS: "US",
					macOS: "AUTO"
				}
			}
		}
	},
	Config: {
		Announcements: {
			"Environment:": {
				"default": "AUTO",
				iOS: "AUTO",
				iPadOS: "AUTO",
				watchOS: "AUTO",
				macOS: "AUTO"
			}
		}
	}
};
var Configs$2 = {
	CN: {
		tileSet: [
			{
				style: 1,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=8",
				supportsMultipathTCP: false
			},
			{
				style: 7,
				validVersion: [
					{
						identifier: 51,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 7
							},
							{
								minX: 179,
								minY: 80,
								maxX: 224,
								maxY: 128,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 359,
								minY: 161,
								maxX: 449,
								maxY: 257,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 719,
								minY: 323,
								maxX: 898,
								maxY: 915,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 1438,
								minY: 646,
								maxX: 1797,
								maxY: 1031,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 2876,
								minY: 1292,
								maxX: 3594,
								maxY: 2062,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 5752,
								minY: 2584,
								maxX: 7188,
								maxY: 4124,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 11504,
								minY: 5168,
								maxX: 14376,
								maxY: 8248,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 23008,
								minY: 10336,
								maxX: 28752,
								maxY: 16496,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 46016,
								minY: 20672,
								maxX: 57504,
								maxY: 32992,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 92032,
								minY: 41344,
								maxX: 115008,
								maxY: 65984,
								minZ: 17,
								maxZ: 17
							},
							{
								minX: 184064,
								minY: 82668,
								maxX: 230016,
								maxY: 131976,
								minZ: 18,
								maxZ: 18
							}
						],
						genericTile: [
							{
								tileType: 2,
								textureIndex: 0,
								resourceIndex: 1971
							}
						]
					}
				],
				scale: 1,
				size: 1,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-2-cn-ssl.ls.apple.com/2/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 7,
				validVersion: [
					{
						identifier: 51,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 7
							},
							{
								minX: 179,
								minY: 80,
								maxX: 224,
								maxY: 128,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 359,
								minY: 161,
								maxX: 449,
								maxY: 257,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 719,
								minY: 323,
								maxX: 898,
								maxY: 915,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 1438,
								minY: 646,
								maxX: 1797,
								maxY: 1031,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 2876,
								minY: 1292,
								maxX: 3594,
								maxY: 2062,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 5752,
								minY: 2584,
								maxX: 7188,
								maxY: 4124,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 11504,
								minY: 5168,
								maxX: 14376,
								maxY: 8248,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 23008,
								minY: 10336,
								maxX: 28752,
								maxY: 16496,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 46016,
								minY: 20672,
								maxX: 57504,
								maxY: 32992,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 92032,
								minY: 41344,
								maxX: 115008,
								maxY: 65984,
								minZ: 17,
								maxZ: 17
							},
							{
								minX: 184064,
								minY: 82668,
								maxX: 230016,
								maxY: 131976,
								minZ: 18,
								maxZ: 18
							}
						],
						genericTile: [
							{
								tileType: 2,
								textureIndex: 0,
								resourceIndex: 1971
							}
						]
					}
				],
				scale: 2,
				size: 1,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-2-cn-ssl.ls.apple.com/2/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 11,
				validVersion: [
					{
						identifier: 470,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=1",
				supportsMultipathTCP: false
			},
			{
				style: 12,
				validVersion: [
					{
						identifier: 2111,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 120
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe12-cn-ssl.ls.apple.com/traffic",
				supportsMultipathTCP: false
			},
			{
				style: 13,
				validVersion: [
					{
						identifier: 2092,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 604800,
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=2",
				supportsMultipathTCP: false
			},
			{
				style: 18,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 20,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 22,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 30,
				validVersion: [
					{
						identifier: 146,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 262143,
								maxY: 262143,
								minZ: 18,
								maxZ: 18
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 37,
				validVersion: [
					{
						identifier: 1904,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=2",
				supportsMultipathTCP: false
			},
			{
				style: 47,
				validVersion: [
					{
						identifier: 1904,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 48,
				validVersion: [
					{
						identifier: 1904,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 53,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 54,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 56,
				validVersion: [
					{
						identifier: 16,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 57,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 3600
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gsp76-cn-ssl.ls.apple.com/api/tile",
				supportsMultipathTCP: false
			},
			{
				style: 58,
				validVersion: [
					{
						identifier: 137,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 59,
				validVersion: [
					{
						identifier: 80,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/asset/v3/model",
				supportsMultipathTCP: false
			},
			{
				style: 60,
				validVersion: [
					{
						identifier: 30,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/asset/v3/material",
				supportsMultipathTCP: false
			},
			{
				style: 61,
				validVersion: [
					{
						identifier: 30,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 64,
				validVersion: [
					{
						identifier: 16,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 65,
				validVersion: [
					{
						identifier: 2,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 3600
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-cn-ssl.ls.apple.com/65/v1",
				supportsMultipathTCP: false
			},
			{
				style: 66,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 67,
				validVersion: [
					{
						identifier: 2112,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 68,
				validVersion: [
					{
						identifier: 2092,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 69,
				validVersion: [
					{
						identifier: 21,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 72,
				validVersion: [
					{
						identifier: 2,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 3600
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportsMultipathTCP: false
			},
			{
				style: 73,
				validVersion: [
					{
						identifier: 470,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 76,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 524287,
								maxY: 524287,
								minZ: 19,
								maxZ: 19
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-cn-ssl.ls.apple.com/sis/v1",
				supportsMultipathTCP: false
			},
			{
				style: 79,
				validVersion: [
					{
						identifier: 29,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				supportsMultipathTCP: false
			},
			{
				style: 84,
				validVersion: [
					{
						identifier: 2092,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 1800,
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-2-cn-ssl.ls.apple.com/poi_update",
				supportsMultipathTCP: false
			}
		],
		attribution: [
			{
				name: "AutoNavi",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-cn2-66.html",
				resource: [
					{
						resourceType: 6,
						filename: "autonavi-4.png",
						checksum: {
							"0": 61,
							"1": 130,
							"2": 126,
							"3": 203,
							"4": 170,
							"5": 234,
							"6": 91,
							"7": 182,
							"8": 191,
							"9": 120,
							"10": 72,
							"11": 19,
							"12": 46,
							"13": 58,
							"14": 235,
							"15": 55,
							"16": 221,
							"17": 53,
							"18": 252,
							"19": 219
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 6,
						filename: "autonavi-4@2x.png",
						checksum: {
							"0": 101,
							"1": 191,
							"2": 219,
							"3": 234,
							"4": 178,
							"5": 237,
							"6": 6,
							"7": 231,
							"8": 236,
							"9": 110,
							"10": 3,
							"11": 82,
							"12": 194,
							"13": 129,
							"14": 29,
							"15": 221,
							"16": 225,
							"17": 55,
							"18": 26,
							"19": 203
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 6,
						filename: "autonavi-4@2x.png",
						checksum: {
							"0": 101,
							"1": 191,
							"2": 219,
							"3": 234,
							"4": 178,
							"5": 237,
							"6": 6,
							"7": 231,
							"8": 236,
							"9": 110,
							"10": 3,
							"11": 82,
							"12": 194,
							"13": 129,
							"14": 29,
							"15": 221,
							"16": 225,
							"17": 55,
							"18": 26,
							"19": 203
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 5,
						filename: "autonavi-logo-mask-1.png",
						checksum: {
							"0": 247,
							"1": 152,
							"2": 81,
							"3": 90,
							"4": 135,
							"5": 206,
							"6": 171,
							"7": 138,
							"8": 151,
							"9": 37,
							"10": 167,
							"11": 77,
							"12": 112,
							"13": 223,
							"14": 89,
							"15": 164,
							"16": 242,
							"17": 201,
							"18": 164,
							"19": 74
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 5,
						filename: "autonavi-logo-mask-1@2x.png",
						checksum: {
							"0": 54,
							"1": 203,
							"2": 95,
							"3": 5,
							"4": 82,
							"5": 108,
							"6": 189,
							"7": 170,
							"8": 124,
							"9": 255,
							"10": 39,
							"11": 153,
							"12": 245,
							"13": 47,
							"14": 224,
							"15": 93,
							"16": 202,
							"17": 181,
							"18": 11,
							"19": 127
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 5,
						filename: "autonavi-logo-mask-1@3x.png",
						checksum: {
							"0": 131,
							"1": 225,
							"2": 158,
							"3": 241,
							"4": 69,
							"5": 218,
							"6": 172,
							"7": 162,
							"8": 166,
							"9": 241,
							"10": 48,
							"11": 174,
							"12": 31,
							"13": 104,
							"14": 225,
							"15": 155,
							"16": 97,
							"17": 143,
							"18": 15,
							"19": 99
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					}
				],
				region: [
				],
				linkDisplayStringIndex: 0
			},
			{
				name: "© GeoTechnologies, Inc.",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-cn2-66.html",
				resource: [
				],
				region: [
					{
						minX: 218,
						minY: 102,
						maxX: 225,
						maxY: 104,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 221,
						minY: 98,
						maxX: 228,
						maxY: 101,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 226,
						minY: 91,
						maxX: 231,
						maxY: 97,
						minZ: 8,
						maxZ: 21
					}
				],
				linkDisplayStringIndex: 0
			}
		],
		urlInfoSet: [
			{
				alternateResourcesURL: [
					{
						url: "https://cdn.apple-mapkit.com/rap",
						supportsMultipathTCP: false
					},
					{
						url: "https://limit-rule.is.autonavi.com/lpr/rules/download",
						supportsMultipathTCP: false
					}
				],
				resourcesURL: {
					url: "https://gspe21-ssl.ls.apple.com/",
					supportsMultipathTCP: false
				},
				searchAttributionManifestURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/search-attribution-1263",
					supportsMultipathTCP: false
				},
				directionsURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				etaURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderURL: {
					url: "https://batch-rgeo.is.autonavi.com/batchRGeo",
					supportsMultipathTCP: false
				},
				simpleETAURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				polyLocationShiftURL: {
					url: "https://shift.is.autonavi.com/localshift",
					supportsMultipathTCP: false
				},
				problemSubmissionURL: {
					url: "https://rap.is.autonavi.com/rap",
					supportsMultipathTCP: false
				},
				problemStatusURL: {
					url: "https://rap.is.autonavi.com/rapstatus",
					supportsMultipathTCP: false
				},
				reverseGeocoderVersionsURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/revgeo-version-11.plist",
					supportsMultipathTCP: false
				},
				problemCategoriesURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/com.apple.GEO.BusinessLocalizedCategories-424.plist",
					supportsMultipathTCP: false
				},
				announcementsURL: {
					url: "https://gspe35-ssl.ls.apple.com/config/announcements?environment=prod-cn",
					supportsMultipathTCP: false
				},
				dispatcherURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				abExperimentURL: {
					url: "https://gsp-ssl.ls.apple.com/cn/ab.arpc",
					supportsMultipathTCP: false
				},
				logMessageUsageURL: {
					url: "https://gsp64-ssl.ls.apple.com/a/v2/use",
					supportsMultipathTCP: false
				},
				spatialLookupURL: {
					url: "https://spatialsearch.is.autonavi.com/spatialsearch",
					supportsMultipathTCP: false
				},
				realtimeTrafficProbeURL: {
					url: "https://gsp9-ssl.apple.com/hvr/v2/rtloc",
					supportsMultipathTCP: false
				},
				batchTrafficProbeURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/v2/loc",
					supportsMultipathTCP: false
				},
				logMessageUsageV3URL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				backgroundDispatcherURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				backgroundRevGeoURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				wifiConnectionQualityProbeURL: {
					url: "https://gsp10-ssl-cn.ls.apple.com/hvr/wcq",
					supportsMultipathTCP: false
				},
				wifiQualityURL: {
					url: "https://gsp85-cn-ssl.ls.apple.com/wifi_request",
					supportsMultipathTCP: false
				},
				feedbackSubmissionURL: {
					url: "https://rap.is.autonavi.com/rap",
					supportsMultipathTCP: false
				},
				feedbackLookupURL: {
					url: "https://rap.is.autonavi.com/lookup",
					supportsMultipathTCP: false
				},
				junctionImageServiceURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				analyticsCohortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				analyticsLongSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				analyticsShortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				analyticsSessionlessURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				webModuleBaseURL: {
					url: "https://placecard-server-wm.is.autonavi.com",
					supportsMultipathTCP: false
				},
				wifiQualityTileURL: {
					url: "https://gspe85-cn-ssl.ls.apple.com/wifi_request_tile",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderPlaceRequestURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				poiBusynessActivityCollectionURL: {
					url: "https://gsp53-ssl.ls.apple.com/hvr/rt_poi_activity",
					supportsMultipathTCP: false
				},
				rapWebBundleURL: {
					url: "https://cdn.apple-mapkit.com/rap",
					supportsMultipathTCP: false
				},
				offlineDataBatchListURL: {
					url: "https://ods.is.autonavi.com/api/batchesForRegion",
					supportsMultipathTCP: false
				},
				offlineDataSizeURL: {
					url: "https://ods.is.autonavi.com/api/sizeForRegion",
					supportsMultipathTCP: false
				},
				offlineDataDownloadBaseURL: {
					url: "https://gspe121-cn-ssl.ls.apple.com",
					supportsMultipathTCP: false
				}
			}
		],
		muninBucket: [
			{
				bucketID: 2,
				bucketURL: "https://gspe72-cn-ssl.ls.apple.com/mnn_us"
			},
			{
				bucketID: 6,
				bucketURL: "https://gspe72-cn-ssl.ls.apple.com/mnn_us"
			}
		]
	},
	XX: {
		tileSet: [
			{
				style: 1,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=8",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 1,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=8",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 7,
				validVersion: [
					{
						identifier: 9711,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 22
							}
						],
						genericTile: [
							{
								tileType: 2,
								textureIndex: 0,
								resourceIndex: 1971
							}
						]
					}
				],
				scale: 1,
				size: 1,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 7,
				validVersion: [
					{
						identifier: 9711,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 22
							}
						],
						genericTile: [
							{
								tileType: 2,
								textureIndex: 0,
								resourceIndex: 1971
							}
						]
					}
				],
				scale: 2,
				size: 1,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 11,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=1",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 11,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=1",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 12,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 120
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe12-ssl.ls.apple.com/traffic",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 12,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 120
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe12-kittyhawk-ssl.ls.apple.com/traffic",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 13,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=2",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 13,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=2",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 14,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 15,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 16,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 17,
				validVersion: [
					{
						identifier: 27,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 408,
								minY: 2760,
								maxX: 2583,
								maxY: 3659,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 3848,
								minY: 2332,
								maxX: 4535,
								maxY: 3235,
								minZ: 13,
								maxZ: 13
							}
						],
						genericTile: [
						]
					}
				],
				scale: 1,
				size: 1,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 18,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 18,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 20,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 20,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 22,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 22,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 30,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 262143,
								maxY: 262143,
								minZ: 18,
								maxZ: 18
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 30,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 262143,
								maxY: 262143,
								minZ: 18,
								maxZ: 18
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 33,
				validVersion: [
					{
						identifier: 4,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 7
							}
						],
						genericTile: [
						]
					}
				],
				scale: 1,
				size: 1,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 37,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=2",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 37,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=2",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 42,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 43,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 44,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 47,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 47,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 48,
				validVersion: [
					{
						identifier: 11201196,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 48,
				validVersion: [
					{
						identifier: 11201196,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 52,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				supportsMultipathTCP: false
			},
			{
				style: 53,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 53,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 54,
				validVersion: [
					{
						identifier: 13658945,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 54,
				validVersion: [
					{
						identifier: 13659050,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 56,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 56,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 57,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 3600
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe76-ssl.ls.apple.com/api/tile",
				supportsMultipathTCP: false
			},
			{
				style: 58,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 58,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 59,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/asset/v3/model",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 59,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/asset/v3/model",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 60,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/asset/v3/material",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 60,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/asset/v3/material",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 61,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 61,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 62,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 62,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 64,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 64,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 65,
				validVersion: [
					{
						identifier: 2,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 3600
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/65/v1",
				supportsMultipathTCP: false
			},
			{
				style: 66,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 66,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 67,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 67,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 68,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 68,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 69,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 69,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 70,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe76-ssl.ls.apple.com/api/vltile",
				supportsMultipathTCP: false
			},
			{
				style: 71,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 2097151,
								maxY: 2097151,
								minZ: 21,
								maxZ: 21
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe92-ssl.ls.apple.com",
				supportsMultipathTCP: false
			},
			{
				style: 72,
				validVersion: [
					{
						identifier: 2,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 3600
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/72/v2",
				supportsMultipathTCP: false
			},
			{
				style: 73,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 73,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 74,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2097151,
								maxY: 2097151,
								minZ: 21,
								maxZ: 21
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/pbz/v1",
				supportsMultipathTCP: false
			},
			{
				style: 75,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/pbz/v1",
				supportsMultipathTCP: false
			},
			{
				style: 76,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 524287,
								maxY: 524287,
								minZ: 19,
								maxZ: 19
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/sis/v1",
				supportsMultipathTCP: false
			},
			{
				style: 78,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 78,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 79,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 79,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 80,
				validVersion: [
					{
						identifier: 0,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/sdm/v1",
				supportsMultipathTCP: false
			},
			{
				style: 82,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/asset/v3/model-occlusion",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 82,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/asset/v3/model-occlusion",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 84,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 1800,
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/poi_update",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 84,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							},
							{
								minX: 0,
								minY: 0,
								maxX: 65535,
								maxY: 65535,
								minZ: 16,
								maxZ: 16
							},
							{
								minX: 0,
								minY: 0,
								maxX: 131071,
								maxY: 131071,
								minZ: 17,
								maxZ: 17
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 1800,
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/poi_update",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 85,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/live_tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 85,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/live_tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 87,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 87,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 1,
								maxY: 1,
								minZ: 1,
								maxZ: 1
							},
							{
								minX: 0,
								minY: 0,
								maxX: 3,
								maxY: 3,
								minZ: 2,
								maxZ: 2
							},
							{
								minX: 0,
								minY: 0,
								maxX: 7,
								maxY: 7,
								minZ: 3,
								maxZ: 3
							},
							{
								minX: 0,
								minY: 0,
								maxX: 15,
								maxY: 15,
								minZ: 4,
								maxZ: 4
							},
							{
								minX: 0,
								minY: 0,
								maxX: 31,
								maxY: 31,
								minZ: 5,
								maxZ: 5
							},
							{
								minX: 0,
								minY: 0,
								maxX: 63,
								maxY: 63,
								minZ: 6,
								maxZ: 6
							},
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 255,
								maxY: 255,
								minZ: 8,
								maxZ: 8
							},
							{
								minX: 0,
								minY: 0,
								maxX: 511,
								maxY: 511,
								minZ: 9,
								maxZ: 9
							},
							{
								minX: 0,
								minY: 0,
								maxX: 1023,
								maxY: 1023,
								minZ: 10,
								maxZ: 10
							},
							{
								minX: 0,
								minY: 0,
								maxX: 2047,
								maxY: 2047,
								minZ: 11,
								maxZ: 11
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							},
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 16383,
								maxY: 16383,
								minZ: 14,
								maxZ: 14
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						],
						supportedLanguagesVersion: 1
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
					{
						identifier: 1,
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						]
					}
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 88,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 88,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 127,
								maxY: 127,
								minZ: 7,
								maxZ: 7
							},
							{
								minX: 0,
								minY: 0,
								maxX: 4095,
								maxY: 4095,
								minZ: 12,
								maxZ: 12
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			},
			{
				style: 89,
				validVersion: [
					{
						identifier: 1,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 262143,
								maxY: 262143,
								minZ: 18,
								maxZ: 18
							}
						],
						genericTile: [
						],
						timeToLiveSeconds: 86400
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe79-ssl.ls.apple.com/ray/v1",
				supportsMultipathTCP: false
			},
			{
				style: 90,
				validVersion: [
					{
						identifier: 16034178,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf",
				dataSet: 0,
				supportsMultipathTCP: false
			},
			{
				style: 90,
				validVersion: [
					{
						identifier: 16030619,
						availableTiles: [
							{
								minX: 0,
								minY: 0,
								maxX: 8191,
								maxY: 8191,
								minZ: 13,
								maxZ: 13
							},
							{
								minX: 0,
								minY: 0,
								maxX: 32767,
								maxY: 32767,
								minZ: 15,
								maxZ: 15
							}
						],
						genericTile: [
						]
					}
				],
				scale: 0,
				size: 2,
				supportedLanguage: [
				],
				countryRegionWhitelist: [
				],
				checksumType: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf",
				dataSet: 1,
				supportsMultipathTCP: false
			}
		],
		attribution: [
			{
				name: "‎",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-275.html",
				resource: [
				],
				region: [
				],
				linkDisplayStringIndex: 0,
				plainTextURL: "https://gspe21-ssl.ls.apple.com/html/attribution-274.txt",
				plainTextURLSHA256Checksum: {
					"0": 95,
					"1": 21,
					"2": 102,
					"3": 110,
					"4": 8,
					"5": 247,
					"6": 232,
					"7": 236,
					"8": 45,
					"9": 156,
					"10": 70,
					"11": 137,
					"12": 179,
					"13": 197,
					"14": 80,
					"15": 243,
					"16": 60,
					"17": 246,
					"18": 254,
					"19": 239,
					"20": 198,
					"21": 57,
					"22": 65,
					"23": 219,
					"24": 22,
					"25": 147,
					"26": 180,
					"27": 123,
					"28": 186,
					"29": 78,
					"30": 122,
					"31": 162
				}
			},
			{
				name: "MMI",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-275.html",
				resource: [
					{
						resourceType: 5,
						filename: "mmi-mask-2.png",
						checksum: {
							"0": 35,
							"1": 54,
							"2": 2,
							"3": 219,
							"4": 218,
							"5": 184,
							"6": 124,
							"7": 50,
							"8": 35,
							"9": 32,
							"10": 86,
							"11": 20,
							"12": 147,
							"13": 223,
							"14": 7,
							"15": 41,
							"16": 209,
							"17": 238,
							"18": 32,
							"19": 41
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 5,
						filename: "mmi-mask-2@2x.png",
						checksum: {
							"0": 5,
							"1": 160,
							"2": 112,
							"3": 185,
							"4": 3,
							"5": 255,
							"6": 7,
							"7": 75,
							"8": 78,
							"9": 139,
							"10": 52,
							"11": 81,
							"12": 151,
							"13": 231,
							"14": 143,
							"15": 29,
							"16": 187,
							"17": 109,
							"18": 220,
							"19": 80
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					},
					{
						resourceType: 5,
						filename: "mmi-mask-2@3x.png",
						checksum: {
							"0": 240,
							"1": 170,
							"2": 204,
							"3": 91,
							"4": 161,
							"5": 113,
							"6": 81,
							"7": 101,
							"8": 136,
							"9": 205,
							"10": 115,
							"11": 2,
							"12": 192,
							"13": 97,
							"14": 106,
							"15": 34,
							"16": 227,
							"17": 214,
							"18": 74,
							"19": 220
						},
						region: [
						],
						filter: [
						],
						validationMethod: 0,
						updateMethod: 0
					}
				],
				region: [
					{
						minX: 176,
						minY: 110,
						maxX: 183,
						maxY: 122,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 178,
						minY: 107,
						maxX: 188,
						maxY: 107,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 178,
						minY: 108,
						maxX: 183,
						maxY: 109,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 180,
						minY: 105,
						maxX: 180,
						maxY: 106,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 181,
						minY: 104,
						maxX: 183,
						maxY: 106,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 182,
						minY: 103,
						maxX: 182,
						maxY: 103,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 184,
						minY: 104,
						maxX: 184,
						maxY: 106,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 184,
						minY: 108,
						maxX: 195,
						maxY: 110,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 184,
						minY: 111,
						maxX: 194,
						maxY: 111,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 184,
						minY: 112,
						maxX: 191,
						maxY: 120,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 184,
						minY: 121,
						maxX: 184,
						maxY: 121,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 185,
						minY: 105,
						maxX: 185,
						maxY: 106,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 190,
						minY: 107,
						maxX: 190,
						maxY: 107,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 193,
						minY: 118,
						maxX: 194,
						maxY: 123,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 195,
						minY: 118,
						maxX: 195,
						maxY: 118,
						minZ: 8,
						maxZ: 21
					}
				],
				linkDisplayStringIndex: 0
			},
			{
				name: "© GeoTechnologies, Inc.",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-275.html",
				resource: [
				],
				region: [
					{
						minX: 218,
						minY: 102,
						maxX: 225,
						maxY: 104,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 221,
						minY: 98,
						maxX: 228,
						maxY: 101,
						minZ: 8,
						maxZ: 21
					},
					{
						minX: 226,
						minY: 91,
						maxX: 231,
						maxY: 97,
						minZ: 8,
						maxZ: 21
					}
				],
				linkDisplayStringIndex: 0
			}
		],
		urlInfoSet: [
			{
				alternateResourcesURL: [
					{
						url: "https://cdn.apple-mapkit.com/rap",
						supportsMultipathTCP: false
					}
				],
				resourcesURL: {
					url: "https://gspe21-ssl.ls.apple.com/",
					supportsMultipathTCP: false
				},
				searchAttributionManifestURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/search-attribution-1262",
					supportsMultipathTCP: false
				},
				directionsURL: {
					url: "https://gsp-ssl.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				etaURL: {
					url: "https://gsp-ssl.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				batchReverseGeocoderURL: {
					url: "https://gsp36-ssl.ls.apple.com/revgeo.arpc",
					supportsMultipathTCP: false
				},
				simpleETAURL: {
					url: "https://gsp-ssl.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				addressCorrectionInitURL: {
					url: "https://gsp47-ssl.ls.apple.com/ac",
					supportsMultipathTCP: false
				},
				addressCorrectionUpdateURL: {
					url: "https://gsp47-ssl.ls.apple.com/ac",
					supportsMultipathTCP: false
				},
				problemSubmissionURL: {
					url: "https://sundew.ls.apple.com/v1/feedback/submission.arpc",
					supportsMultipathTCP: false
				},
				problemStatusURL: {
					url: "https://sundew.ls.apple.com/grp/st",
					supportsMultipathTCP: false
				},
				reverseGeocoderVersionsURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/revgeo-version-11.plist",
					supportsMultipathTCP: false
				},
				problemCategoriesURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/com.apple.GEO.BusinessLocalizedCategories-424.plist",
					supportsMultipathTCP: false
				},
				announcementsURL: {
					url: "https://gspe35-ssl.ls.apple.com/config/announcements?environment=prod",
					supportsMultipathTCP: false
				},
				dispatcherURL: {
					url: "https://gsp-ssl.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				problemOptInURL: {
					url: "https://sundew.ls.apple.com/grp/oi",
					supportsMultipathTCP: false
				},
				abExperimentURL: {
					url: "https://gsp-ssl.ls.apple.com/ab.arpc",
					supportsMultipathTCP: false
				},
				businessPortalBaseURL: {
					url: "https://mapsconnect.apple.com/business/ui/claimPlace",
					supportsMultipathTCP: false
				},
				logMessageUsageURL: {
					url: "https://gsp64-ssl.ls.apple.com/a/v2/use",
					supportsMultipathTCP: false
				},
				spatialLookupURL: {
					url: "https://gsp51-ssl.ls.apple.com/api/v1.0/poi/data",
					supportsMultipathTCP: false
				},
				realtimeTrafficProbeURL: {
					url: "https://gsp9-ssl.apple.com/hvr/v2/rtloc",
					supportsMultipathTCP: false
				},
				batchTrafficProbeURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/v2/loc",
					supportsMultipathTCP: false
				},
				proactiveRoutingURL: {
					url: "https://gsp-ssl-commute.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				logMessageUsageV3URL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				backgroundDispatcherURL: {
					url: "https://gsp57-ssl-background.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				bluePOIDispatcherURL: {
					url: "https://gsp57-ssl-locus.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				backgroundRevGeoURL: {
					url: "https://gsp57-ssl-revgeo.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: false
				},
				wifiConnectionQualityProbeURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/wcq",
					supportsMultipathTCP: false
				},
				wifiQualityURL: {
					url: "https://gsp85-ssl.ls.apple.com/wifi_request",
					supportsMultipathTCP: false
				},
				feedbackSubmissionURL: {
					url: "https://sundew.ls.apple.com/v1/feedback/submission.arpc",
					supportsMultipathTCP: false
				},
				feedbackLookupURL: {
					url: "https://gsp-ssl.ls.apple.com/feedback.arpc",
					supportsMultipathTCP: false
				},
				analyticsCohortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				analyticsLongSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				analyticsShortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				analyticsSessionlessURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				webModuleBaseURL: {
					url: "https://maps.apple.com",
					supportsMultipathTCP: false
				},
				wifiQualityTileURL: {
					url: "https://gspe85-ssl.ls.apple.com/wifi_request_tile",
					supportsMultipathTCP: false
				},
				addressCorrectionTaggedLocationURL: {
					url: "https://gsp47-ssl.ls.apple.com/ac",
					supportsMultipathTCP: false
				},
				proactiveAppClipURL: {
					url: "https://gspe79-ssl.ls.apple.com/72/v2",
					supportsMultipathTCP: false
				},
				enrichmentSubmissionURL: {
					url: "https://sundew.ls.apple.com/v1/feedback/submission.arpc",
					supportsMultipathTCP: false
				},
				ugcLogDiscardURL: {
					url: "https://sundew.ls.apple.com/v1/log_message",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderPlaceRequestURL: {
					url: "https://gsp36-ssl.ls.apple.com/revgeo_pr.arpc",
					supportsMultipathTCP: false
				},
				pressureProbeDataURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/cpr",
					supportsMultipathTCP: false
				},
				poiBusynessActivityCollectionURL: {
					url: "https://gsp53-ssl.ls.apple.com/hvr/rt_poi_activity",
					supportsMultipathTCP: false
				},
				rapWebBundleURL: {
					url: "https://cdn.apple-mapkit.com/rap",
					supportsMultipathTCP: false
				},
				networkSelectionHarvestURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/strn",
					supportsMultipathTCP: false
				},
				offlineDataBatchListURL: {
					url: "https://gspe121-ssl.ls.apple.com/api/batchesForRegion",
					supportsMultipathTCP: false
				},
				offlineDataSizeURL: {
					url: "https://gspe121-ssl.ls.apple.com/api/sizeForRegion",
					supportsMultipathTCP: false
				},
				offlineDataDownloadBaseURL: {
					url: "https://gspe121-ssl.ls.apple.com",
					supportsMultipathTCP: false
				},
				bcxDispatcherURL: {
					url: "https://gsp57-ssl-bcx.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: false
				}
			}
		],
		muninBucket: [
			{
				bucketID: 2,
				bucketURL: "https://gspe72-ssl.ls.apple.com/mnn_us"
			},
			{
				bucketID: 6,
				bucketURL: "https://gspe72-ssl.ls.apple.com/mnn_us"
			}
		]
	}
};
var Maps = {
	Settings: Settings$5,
	Configs: Configs$2
};

var Maps$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs$2,
	Settings: Settings$5,
	default: Maps
});

var Settings$4 = {
	Switch: true,
	CountryCode: "US",
	newsPlusUser: true
};
var News = {
	Settings: Settings$4
};

var News$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$4,
	default: News
});

var Settings$3 = {
	Switch: true,
	CountryCode: "US",
	canUse: true
};
var PrivateRelay = {
	Settings: Settings$3
};

var PrivateRelay$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$3,
	default: PrivateRelay
});

var Settings$2 = {
	Switch: true,
	CountryCode: "SG",
	Domains: [
		"web",
		"itunes",
		"app_store",
		"movies",
		"restaurants",
		"maps"
	],
	Functions: [
		"flightutilities",
		"lookup",
		"mail",
		"messages",
		"news",
		"safari",
		"siri",
		"spotlight",
		"visualintelligence"
	],
	Safari_Smart_History: true
};
var Configs$1 = {
	VisualIntelligence: {
		enabled_domains: [
			"pets",
			"media",
			"books",
			"art",
			"nature",
			"landmarks"
		],
		supported_domains: [
			"ART",
			"BOOK",
			"MEDIA",
			"LANDMARK",
			"ANIMALS",
			"BIRDS",
			"FOOD",
			"SIGN_SYMBOL",
			"AUTO_SYMBOL",
			"DOGS",
			"NATURE",
			"NATURAL_LANDMARK",
			"INSECTS",
			"REPTILES",
			"ALBUM",
			"STOREFRONT",
			"LAUNDRY_CARE_SYMBOL",
			"CATS",
			"OBJECT_2D",
			"SCULPTURE",
			"SKYLINE",
			"MAMMALS"
		]
	}
};
var Siri = {
	Settings: Settings$2,
	Configs: Configs$1
};

var Siri$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs$1,
	Settings: Settings$2,
	default: Siri
});

var Settings$1 = {
	Switch: "true",
	CountryCode: "US",
	MultiAccount: "false",
	Universal: "true"
};
var TestFlight = {
	Settings: Settings$1
};

var TestFlight$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$1,
	default: TestFlight
});

var Settings = {
	Switch: true,
	"Third-Party": false,
	HLSUrl: "play-edge.itunes.apple.com",
	ServerUrl: "play.itunes.apple.com",
	Tabs: [
		"WatchNow",
		"Originals",
		"MLS",
		"Sports",
		"Kids",
		"Store",
		"Movies",
		"TV",
		"ChannelsAndApps",
		"Library",
		"Search"
	],
	CountryCode: {
		Configs: "AUTO",
		Settings: "AUTO",
		View: [
			"SG",
			"TW"
		],
		WatchNow: "AUTO",
		Channels: "AUTO",
		Originals: "AUTO",
		Sports: "US",
		Kids: "US",
		Store: "AUTO",
		Movies: "AUTO",
		TV: "AUTO",
		Persons: "SG",
		Search: "AUTO",
		Others: "AUTO"
	}
};
var Configs = {
	Locale: [
		[
			"AU",
			"en-AU"
		],
		[
			"CA",
			"en-CA"
		],
		[
			"GB",
			"en-GB"
		],
		[
			"KR",
			"ko-KR"
		],
		[
			"HK",
			"yue-Hant"
		],
		[
			"JP",
			"ja-JP"
		],
		[
			"MO",
			"zh-Hant"
		],
		[
			"TW",
			"zh-Hant"
		],
		[
			"US",
			"en-US"
		],
		[
			"SG",
			"zh-Hans"
		]
	],
	Tabs: [
		{
			title: "主页",
			type: "WatchNow",
			universalLinks: [
				"https://tv.apple.com/watch-now",
				"https://tv.apple.com/home"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_watchnow",
				type: "Root",
				url: "https://tv.apple.com/watch-now"
			},
			isSelected: true
		},
		{
			title: "Apple TV+",
			type: "Originals",
			universalLinks: [
				"https://tv.apple.com/channel/tvs.sbd.4000",
				"https://tv.apple.com/atv"
			],
			destinationType: "Target",
			target: {
				id: "tvs.sbd.4000",
				type: "Brand",
				url: "https://tv.apple.com/us/channel/tvs.sbd.4000"
			}
		},
		{
			title: "MLS Season Pass",
			type: "MLS",
			universalLinks: [
				"https://tv.apple.com/mls"
			],
			destinationType: "Target",
			target: {
				id: "tvs.sbd.7000",
				type: "Brand",
				url: "https://tv.apple.com/us/channel/tvs.sbd.7000"
			}
		},
		{
			title: "体育节目",
			type: "Sports",
			universalLinks: [
				"https://tv.apple.com/sports"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_sports",
				type: "Root",
				url: "https://tv.apple.com/sports"
			}
		},
		{
			title: "儿童",
			type: "Kids",
			universalLinks: [
				"https://tv.apple.com/kids"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_kids",
				type: "Root",
				url: "https://tv.apple.com/kids"
			}
		},
		{
			title: "电影",
			type: "Movies",
			universalLinks: [
				"https://tv.apple.com/movies"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_movies",
				type: "Root",
				url: "https://tv.apple.com/movies"
			}
		},
		{
			title: "电视节目",
			type: "TV",
			universalLinks: [
				"https://tv.apple.com/tv-shows"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_tvshows",
				type: "Root",
				url: "https://tv.apple.com/tv-shows"
			}
		},
		{
			title: "商店",
			type: "Store",
			universalLinks: [
				"https://tv.apple.com/store"
			],
			destinationType: "SubTabs",
			subTabs: [
				{
					title: "电影",
					type: "Movies",
					universalLinks: [
						"https://tv.apple.com/movies"
					],
					destinationType: "Target",
					target: {
						id: "tahoma_movies",
						type: "Root",
						url: "https://tv.apple.com/movies"
					}
				},
				{
					title: "电视节目",
					type: "TV",
					universalLinks: [
						"https://tv.apple.com/tv-shows"
					],
					destinationType: "Target",
					target: {
						id: "tahoma_tvshows",
						type: "Root",
						url: "https://tv.apple.com/tv-shows"
					}
				}
			]
		},
		{
			title: "频道和 App",
			destinationType: "SubTabs",
			subTabsPlacementType: "ExpandedList",
			type: "ChannelsAndApps",
			subTabs: [
			]
		},
		{
			title: "资料库",
			type: "Library",
			destinationType: "Client"
		},
		{
			title: "搜索",
			type: "Search",
			universalLinks: [
				"https://tv.apple.com/search"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_search",
				type: "Root",
				url: "https://tv.apple.com/search"
			}
		}
	],
	i18n: {
		WatchNow: [
			[
				"en",
				"Home"
			],
			[
				"zh",
				"主页"
			],
			[
				"zh-Hans",
				"主頁"
			],
			[
				"zh-Hant",
				"主頁"
			]
		],
		Movies: [
			[
				"en",
				"Movies"
			],
			[
				"zh",
				"电影"
			],
			[
				"zh-Hans",
				"电影"
			],
			[
				"zh-Hant",
				"電影"
			]
		],
		TV: [
			[
				"en",
				"TV"
			],
			[
				"zh",
				"电视节目"
			],
			[
				"zh-Hans",
				"电视节目"
			],
			[
				"zh-Hant",
				"電視節目"
			]
		],
		Store: [
			[
				"en",
				"Store"
			],
			[
				"zh",
				"商店"
			],
			[
				"zh-Hans",
				"商店"
			],
			[
				"zh-Hant",
				"商店"
			]
		],
		Sports: [
			[
				"en",
				"Sports"
			],
			[
				"zh",
				"体育节目"
			],
			[
				"zh-Hans",
				"体育节目"
			],
			[
				"zh-Hant",
				"體育節目"
			]
		],
		Kids: [
			[
				"en",
				"Kids"
			],
			[
				"zh",
				"儿童"
			],
			[
				"zh-Hans",
				"儿童"
			],
			[
				"zh-Hant",
				"兒童"
			]
		],
		Library: [
			[
				"en",
				"Library"
			],
			[
				"zh",
				"资料库"
			],
			[
				"zh-Hans",
				"资料库"
			],
			[
				"zh-Hant",
				"資料庫"
			]
		],
		Search: [
			[
				"en",
				"Search"
			],
			[
				"zh",
				"搜索"
			],
			[
				"zh-Hans",
				"搜索"
			],
			[
				"zh-Hant",
				"蒐索"
			]
		]
	}
};
var TV = {
	Settings: Settings,
	Configs: Configs
};

var TV$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs,
	Settings: Settings,
	default: TV
});

var Database$1 = Database = {
	"Default": Default$1,
	"Location": Location$1,
	"Maps": Maps$1,
	"News": News$1,
	"PrivateRelay": PrivateRelay$1,
	"Siri": Siri$1,
	"TestFlight": TestFlight$1,
	"TV": TV$1,
};

/**
 * Get Storage Variables
 * @link https://github.com/NanoCat-Me/ENV/blob/main/getStorage.mjs
 * @author VirgilClyne
 * @param {String} key - Persistent Store Key
 * @param {Array} names - Platform Names
 * @param {Object} database - Default Database
 * @return {Object} { Settings, Caches, Configs }
 */
function getStorage(key, names, database) {
    //console.log(`☑️ ${this.name}, Get Environment Variables`, "");
    /***************** BoxJs *****************/
    // 包装为局部变量，用完释放内存
    // BoxJs的清空操作返回假值空字符串, 逻辑或操作符会在左侧操作数为假值时返回右侧操作数。
    let BoxJs = $Storage.getItem(key, database);
    //console.log(`🚧 ${this.name}, Get Environment Variables`, `BoxJs类型: ${typeof BoxJs}`, `BoxJs内容: ${JSON.stringify(BoxJs)}`, "");
    /***************** Argument *****************/
    let Argument = {};
    if (typeof $argument !== "undefined") {
        if (Boolean($argument)) {
            //console.log(`🎉 ${this.name}, $Argument`);
            let arg = Object.fromEntries($argument.split("&").map((item) => item.split("=").map(i => i.replace(/\"/g, ''))));
            //console.log(JSON.stringify(arg));
            for (let item in arg) Lodash.set(Argument, item, arg[item]);
            //console.log(JSON.stringify(Argument));
        }        //console.log(`✅ ${this.name}, Get Environment Variables`, `Argument类型: ${typeof Argument}`, `Argument内容: ${JSON.stringify(Argument)}`, "");
    }    /***************** Store *****************/
    const Store = { Settings: database?.Default?.Settings || {}, Configs: database?.Default?.Configs || {}, Caches: {} };
    if (!Array.isArray(names)) names = [names];
    //console.log(`🚧 ${this.name}, Get Environment Variables`, `names类型: ${typeof names}`, `names内容: ${JSON.stringify(names)}`, "");
    for (let name of names) {
        Store.Settings = { ...Store.Settings, ...database?.[name]?.Settings, ...Argument, ...BoxJs?.[name]?.Settings };
        Store.Configs = { ...Store.Configs, ...database?.[name]?.Configs };
        if (BoxJs?.[name]?.Caches && typeof BoxJs?.[name]?.Caches === "string") BoxJs[name].Caches = JSON.parse(BoxJs?.[name]?.Caches);
        Store.Caches = { ...Store.Caches, ...BoxJs?.[name]?.Caches };
    }    //console.log(`🚧 ${this.name}, Get Environment Variables`, `Store.Settings类型: ${typeof Store.Settings}`, `Store.Settings: ${JSON.stringify(Store.Settings)}`, "");
    traverseObject(Store.Settings, (key, value) => {
        //console.log(`🚧 ${this.name}, traverseObject`, `${key}: ${typeof value}`, `${key}: ${JSON.stringify(value)}`, "");
        if (value === "true" || value === "false") value = JSON.parse(value); // 字符串转Boolean
        else if (typeof value === "string") {
            if (value.includes(",")) value = value.split(",").map(item => string2number(item)); // 字符串转数组转数字
            else value = string2number(value); // 字符串转数字
        }        return value;
    });
    //console.log(`✅ ${this.name}, Get Environment Variables`, `Store: ${typeof Store.Caches}`, `Store内容: ${JSON.stringify(Store)}`, "");
    return Store;

    /***************** function *****************/
    function traverseObject(o, c) { for (var t in o) { var n = o[t]; o[t] = "object" == typeof n && null !== n ? traverseObject(n, c) : c(t, n); } return o }
    function string2number(string) { if (string && !isNaN(string)) string = parseInt(string, 10); return string }
}

/**
 * Set Environment Variables
 * @author VirgilClyne
 * @param {Object} $ - ENV
 * @param {String} name - Persistent Store Key
 * @param {Array} platforms - Platform Names
 * @param {Object} database - Default DataBase
 * @return {Object} { Settings, Caches, Configs }
 */
function setENV(name, platforms, database) {
	console.log(`☑️ Set Environment Variables`, "");
	let { Settings, Caches, Configs } = getStorage(name, platforms, database);
	/***************** Settings *****************/
	if (Settings?.Tabs && !Array.isArray(Settings?.Tabs)) Lodash.set(Settings, "Tabs", (Settings?.Tabs) ? [Settings.Tabs.toString()] : []);
	if (Settings?.Domains && !Array.isArray(Settings?.Domains)) Lodash.set(Settings, "Domains", (Settings?.Domains) ? [Settings.Domains.toString()] : []);
	if (Settings?.Functions && !Array.isArray(Settings?.Functions)) Lodash.set(Settings, "Functions", (Settings?.Functions) ? [Settings.Functions.toString()] : []);
	console.log(`✅ Set Environment Variables, Settings: ${typeof Settings}, Settings内容: ${JSON.stringify(Settings)}`, "");
	/***************** Caches *****************/
	//console.log(`✅ Set Environment Variables, Caches: ${typeof Caches}, Caches内容: ${JSON.stringify(Caches)}`, "");
	/***************** Configs *****************/
	Configs.Storefront = new Map(Configs.Storefront);
	if (Configs.Locale) Configs.Locale = new Map(Configs.Locale);
	if (Configs.i18n) for (let type in Configs.i18n) Configs.i18n[type] = new Map(Configs.i18n[type]);
	return { Settings, Caches, Configs };
}

const $ = new ENV(" iRingo: 🔍 Siri v3.1.0(6) request.beta");

// 构造回复数据
let $response = undefined;

/***************** Processing *****************/
// 解构URL
const url = new URL($request.url);
$.log(`⚠ url: ${url.toJSON()}`, "");
// 获取连接参数
const METHOD = $request.method, HOST = url.hostname, PATH = url.pathname;
$.log(`⚠ METHOD: ${METHOD}, HOST: ${HOST}, PATH: ${PATH}` , "");
// 解析格式
const FORMAT = ($request.headers?.["Content-Type"] ?? $request.headers?.["content-type"])?.split(";")?.[0];
$.log(`⚠ FORMAT: ${FORMAT}`, "");
(async () => {
	const { Settings, Caches, Configs } = setENV("iRingo", "Siri", Database$1);
	$.log(`⚠ Settings.Switch: ${Settings?.Switch}`, "");
	switch (Settings.Switch) {
		case true:
		default:
			const LOCALE = url.searchParams.get("locale");
			$.log(`🚧 LOCALE: ${LOCALE}`, "");
			Settings.CountryCode = (Settings.CountryCode == "AUTO") ? LOCALE?.match(/[A-Z]{2}$/)?.[0] : Settings.CountryCode;
			url.searchParams.set("cc", Settings.CountryCode);
			// 方法判断
			switch (METHOD) {
				case "POST":
				case "PUT":
				case "PATCH":
				case "DELETE":
					//break; // 不中断，继续处理URL
				case "GET":
				case "HEAD":
				case "OPTIONS":
				default:
					// 主机判断
					switch (HOST) {
						case "api.smoot.apple.com":
						case "api.smoot.apple.cn":
							break;
						case "fbs.smoot.apple.com":
							break;
						case "cdn.smoot.apple.com":
							break;
						default: // 其他主机
							let q = url.searchParams.get("q");
							// 路径判断
							switch (PATH) {
								case "/warm":
								case "/render":
								case "/flight": // 航班
									break;
								case "/search": // 搜索
									switch (url.searchParams.get("qtype")) {
										case "zkw": // 处理"新闻"小组件
											switch (Settings.CountryCode) {
												case "CN":
												case "HK":
												case "MO":
												case "TW":
												case "SG":
													url.searchParams.set("locale", `${Settings.CountryCode}_SG`);
													break;
												case "US":
												case "CA":
												case "UK":
												case "AU":
													// 不做修正
													break;
												default:
													url.searchParams.set("locale", `${Settings.CountryCode}_US`);
													break;
											}											break;
										default: // 其他搜索
											if (q?.startsWith?.("%E5%A4%A9%E6%B0%94%20")) { // 处理"天气"搜索，搜索词"天气 "开头
												console.log("'天气 '开头");
												url.searchParams.set("q", q.replace(/%E5%A4%A9%E6%B0%94/, "weather")); // "天气"替换为"weather"
												if (/^weather%20.*%E5%B8%82$/.test(q)) url.searchParams.set("q", q.replace(/$/, "%E5%B8%82"));
											} else if (q?.endsWith?.("%20%E5%A4%A9%E6%B0%94")) {// 处理"天气"搜索，搜索词" 天气"结尾
												console.log("' 天气'结尾");
												url.searchParams.set("q", q.replace(/%E5%A4%A9%E6%B0%94/, "weather")); // "天气"替换为"weather"
												if (/.*%E5%B8%82%20weather$/.test(q)) url.searchParams.set("q", q.replace(/%20weather$/, "%E5%B8%82%20weather"));
											}											break;
									}									break;
								case "card": // 卡片
									url.searchParams.set("card_locale", LOCALE);
									switch (url.searchParams.get("include")) {
										case "tv":
										case "movies":
											switch (url.searchParams.get("storefront")?.match(/[\d]{6}/g)) { //StoreFront ID, from App Store Region
												case "143463": // CN
													url.searchParams.set("q", q.replace(/%2F[a-z]{2}-[A-Z]{2}/, "%2Fzh-HK"));
													break;
												case "143470": // TW
													url.searchParams.set("q", q.replace(/%2F[a-z]{2}-[A-Z]{2}/, "%2Fzh-TW"));
													break;
												case "143464": // SG
													url.searchParams.set("q", q.replace(/%2F[a-z]{2}-[A-Z]{2}/, "%2Fzh-SG"));
													break;
											}											break;
									}									break;
							}							break;
					}					break;
				case "CONNECT":
				case "TRACE":
					break;
			}			$request.url = url.toString();
			$.log(`🚧 调试信息`, `$request.url: ${$request.url}`, "");
			break;
		case false:
			break;
	}})()
	.catch((e) => $.logErr(e))
	.finally(() => {
		switch ($response) {
			default: // 有构造回复数据，返回构造的回复数据
				if ($.isQuanX()) {
					if (!$response.status) $response.status = "HTTP/1.1 200 OK";
					delete $response.headers?.["Content-Length"];
					delete $response.headers?.["content-length"];
					delete $response.headers?.["Transfer-Encoding"];
					$.done($response);
				} else $.done({ response: $response });
				break;
			case undefined: // 无构造回复数据，发送修改的请求数据
				//$.log(`🚧 finally`, `$request: ${JSON.stringify($request, null, 2)}`, "");
				$.done($request);
				break;
		}	});
