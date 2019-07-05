import axios, { AxiosInstance, AxiosResponse } from 'axios'
import qs from 'qs'


// export class ACMICPCNET extends Browser {
//     public async login(id:string, pw:string) : Promise<boolean> {
//         if (!this.isInitiated) await this.init()
//         await this.page.goto('https://www.acmicpc.net/login')
//         await this.page.type('input[name=login_user_id]', id)
//         await this.page.type('input[name=login_password]', pw)
//         await this.page.click('button.btn-u.pull-right[type=submit]')
//         return this.page.url().indexOf('error') === -1 
//     }
// }


export class ACMICPCNET {
    private req : AxiosInstance = axios.create()

    constructor() {
        this.req.defaults.baseURL = 'https://www.acmicpc.net'
        this.req.defaults.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
        this.req.defaults.withCredentials = true
    }

    private updateCookie(res:AxiosResponse) {
        if (res.headers['set-cookie'] === undefined) return
        res.headers['set-cookie'].forEach((cookie:string) => {
            this.req.defaults.headers['cookie'] += ';' + cookie
        })
    }

    public async login(id:string, pw:string) : Promise<boolean> {
        let rtn = false
        try {
            let res : AxiosResponse
            const data = qs.stringify({
                login_user_id: id,
                login_password: pw,
                next: '/',
                stack: 0
            })
            const config = {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded"
                }
            }

            res = await this.req.get('/')
            this.updateCookie(res)
            res = await this.req.post('/signin', data, config)
            this.updateCookie(res)
        
            rtn = res.data.indexOf('로그아웃') > -1
        } catch (err) {
            console.error(err)
            rtn = false
        } finally {
            return rtn
        }
    }

    public async checkLogin() : Promise<boolean> {
        let rtn = false
        try {
            const res = await this.req.get('/')
            rtn = res.data.indexOf('로그아웃') > -1
        } catch (err) {
            console.error(err)
            rtn = false
        } finally {
            return rtn
        }
    }

    public async submit(problemId:string, source:string, language:string, open:'open'|'close'|'onlyaccepted'|string)
        : Promise<{err?:string, res?:string}> {
        let rtn : {err?:string, res:string} = {res: ''}
        try {
            if (!this.checkLogin())
                throw new Error('not logged in')
            
            let res : AxiosResponse

            res = await this.req.get(`/submit/${problemId}`)
            const csrf = res.data.split('name="csrf_key" value="')[1].split('"')[0]

            res = await this.req.post(`/submit/${problemId}`, qs.stringify({
                problem_id: problemId,
                language: this.getLangCode(language),
                code_open: open,
                source,
                csrf_key: csrf
            }), {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            })
            rtn.res = res.data.split('id = "solution-')[1].split('"')[0]
        } catch (err) {
            rtn.err = err
        } finally {
            return rtn
        }
    }

    private getLangCode(lang:string) : string {
        lang = lang.trim().toLowerCase()
        const map : any = {
            'c': 0,
            'cpp': 88,
            'cpp14': 88,
            'cpp17': 84,
            'java': 3,
            'python3': 28,
            'pypy3': 73,
        }
        return map[lang].toString()
    }
    
    public async getStatus(solutionId:string) : Promise<{err?:string, status?:Status}> {
        let rtn : {err?:string, status?:Status} = {}

        try {
            const res = await this.req.post('/status/ajax', qs.stringify({solution_id: solutionId}), {
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'x-requested-with': 'XMLHttpRequest'}
            })
            const status = new Status()
            const data = eval(res.data)
            status.resultName = data['result_name']
            if (data['memory'] !== undefined)
                status.memory = parseInt(data['memory'])
            if (data['time'] !== undefined)
                status.time = data['time']
            rtn.status = status
        } catch (err) {
            rtn.err = err
        } finally {
            return rtn
        }
    }
}

class Status {
    public custom_result: string = ''
    public memory: number = 0
    public partialSolved: number = 0
    public partiallyAccepted: number = 0
    // 다른것도 많은데 일단 무시함 ㅎㅎ
    public time: string = ''
    public resultName : string = ''

}