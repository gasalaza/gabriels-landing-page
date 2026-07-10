import { spawn } from 'node:child_process';

const commands = [
  ['backend', 'npm', ['run', 'dev', '--workspace', '@gabriels-portfolio/backend']],
  ['frontend', 'npm', ['run', 'dev', '--workspace', '@gabriels-portfolio/frontend']],
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`${name} exited with signal ${signal}`);
    } else if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
    shutdown(code ?? 1);
  });
  return child;
});

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exitCode = code;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
