import chai, { expect } from 'chai'
import { ACMICPCNET } from '../src/lib/acmicpc.net'
import mocha from 'mocha'


const baekjoon = new ACMICPCNET()


chai.should()


describe('ACMICPC.NET TEST', () => {
    it('login', async () => {
        const res = await baekjoon.login('testckcks12', 'testckcks12')
        expect(res).true
        expect(await baekjoon.checkLogin()).true
    }).timeout(10 * 1000)
    it('submit', async () => {
        const src = `#include <iostream>
                        using namespace std;int main() {    int a, b;    cin >> a;    cin >> b;    cout << a + b << endl;        return 0;}`
        let res = await baekjoon.submit('1000', src, 'cpp14', 'close')
        expect(res.err).undefined
        const id = res.res as string
        let msg = ''
        while (true) {
            const resStatus = await baekjoon.getStatus(id)
            if (resStatus.err || resStatus.status === undefined) break
            const status = resStatus.status
            msg = status.resultName
            console.log(msg)
            if (msg.indexOf('맞')) {
                msg += ` (메모리 ${status.memory}KB / 시간 ${status.time} ms)`
                break
            }
            await new Promise((res) => setTimeout(() => res(), 500))
        }
        console.log(msg)
    }).timeout(20 * 1000)
})