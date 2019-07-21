import vscode from 'vscode';
import { ACMICPCNET } from './index';

const baekjoon = new ACMICPCNET();

function checkValidation(str: string): boolean {
    if (str === undefined || str.length === 0) return false;
    return true;
}
async function login(): Promise<{ err?: string }> {
    const id = vscode.workspace
        .getConfiguration('goinmul')
        .get('baekjoon.id') as string;
    const pw = vscode.workspace
        .getConfiguration('goinmul')
        .get('baekjoon.pw') as string;
    if (!(checkValidation(id) && checkValidation(pw)))
        return { err: 'invalid' };

    if (await baekjoon.login(id, pw)) return {};
    else return { err: id };
}

let latestProblemId = '';
const latestProblemIds: {
    [key: string]: string;
} = {};

export default [
    {
        command: 'login',
        callback: async () => {
            vscode.window.showInformationMessage('백준 - 로그인을 시도합니다');
            const res = await login();
            if (!res.err)
                vscode.window.showInformationMessage(
                    '백준 - 로그인에 성공하였습니다'
                );
            else if (res.err === 'invalid')
                vscode.window.showErrorMessage(
                    '백준 - 아이디와 비밀번호를 설정 파일에 입력해주십시오'
                );
            else if (res.err)
                vscode.window.showErrorMessage(
                    `백준 - ${res.err} 로그인에 실패하였습니다`
                );
        }
    },
    {
        command: 'submit',
        callback: async () => {
            if (!(await baekjoon.checkLogin())) {
                vscode.window.showInformationMessage(
                    '백준 - 로그인을 시도합니다'
                );
                const res = await login();
                if (res.err) {
                    vscode.window.showErrorMessage(
                        '백준 - 로그인 정보를 다시 한번 확인해 주십시오'
                    );
                    return;
                }
            }

            const editor = vscode.window.activeTextEditor;
            if (editor === undefined) {
                vscode.window.showErrorMessage(
                    '백준 - 열려있는 파일이 없습니다'
                );
                return;
            }

            const source = editor.document.getText();
            const fileUri = editor.document.uri.toString();
            const fileName = fileUri.split('/').slice(-1)[0];

            if (latestProblemIds[fileUri] === undefined) {
                latestProblemIds[fileUri] = fileName.indexOf('.')
                    ? fileName.split('.')[0]
                    : fileName;
            }

            const problemId = await vscode.window.showInputBox({
                placeHolder: '문제 번호를 입력하여 주십시오',
                value: latestProblemIds[fileUri]
            });
            try {
                if (problemId === undefined) throw new Error();
                latestProblemId = parseInt(problemId).toString();
            } catch (err) {
                vscode.window.showErrorMessage(
                    `백준 - ${problemId} <- 문제번호가 올바르지 않습니다`
                );
                return;
            }
            latestProblemIds[fileUri] = problemId;

            const lang = vscode.workspace
                .getConfiguration('goinmul')
                .get('baekjoon.lang') as string;
            const open = vscode.workspace
                .getConfiguration('goinmul')
                .get('baekjoon.open') as string;
            vscode.window.showInformationMessage(
                `백준 - ${problemId}에 ${lang}으로 제출합니다`
            );
            const submitInfo = await baekjoon.submit(
                problemId,
                source,
                lang,
                open
            );
            if (submitInfo.err || submitInfo.res === undefined) {
                vscode.window.showErrorMessage(
                    `백준 - 제출 도중 오류가 발생하였습니다\n${submitInfo.err}`
                );
                return;
            }

            const solutionId = submitInfo.res;
            const ajax = async () => {
                const res = await baekjoon.getStatus(solutionId);
                if (res.err || res.status === undefined) {
                    vscode.window.showErrorMessage(
                        `백준 - 제출 도중 오류가 발생하였습니다\n${res.err}`
                    );
                    return;
                }
                const status = res.status;
                let msg = status.resultName;
                if (msg.indexOf('채점') > -1) {
                    vscode.window.setStatusBarMessage(msg);
                } else {
                    msg += ` (메모리 ${status.memory}KB / 시간 ${
                        status.time
                    }ms)`;
                    vscode.window.showInformationMessage(msg);
                    vscode.window.setStatusBarMessage(' ', 10);
                    return;
                }
                setTimeout(() => ajax(), 500);
            };
            ajax();
        }
    }
];
