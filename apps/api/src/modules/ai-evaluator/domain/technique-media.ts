import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { assertVideoDuration, EVALUATOR_CLIP_SECONDS, EVALUATOR_FFMPEG_TIMEOUT_MS } from './technique-input.policy';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

type MediaPayload = { contentBase64: string; mimeType: string };

export async function prepareTechniqueMedia(file: { buffer: Buffer; mimetype: string }): Promise<MediaPayload> {
  if (!file.mimetype.startsWith('video/')) {
    return { contentBase64: file.buffer.toString('base64'), mimeType: file.mimetype };
  }
  const id = randomUUID();
  const tempInput = path.join(os.tmpdir(), `eval-in-${id}.mp4`);
  const tempOutput = path.join(os.tmpdir(), `eval-out-${id}.mp4`);
  try {
    await fs.promises.writeFile(tempInput, file.buffer);
    assertVideoDuration(await readDurationSeconds(tempInput));
    await compressClip(tempInput, tempOutput);
    const output = await fs.promises.readFile(tempOutput);
    return { contentBase64: output.toString('base64'), mimeType: 'video/mp4' };
  } finally {
    await removeTemp(tempInput);
    await removeTemp(tempOutput);
  }
}

function readDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegInstaller.path, ['-i', filePath, '-hide_banner'], { windowsHide: true });
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => finish(new Error('duration timeout')), EVALUATOR_FFMPEG_TIMEOUT_MS);
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', () => finish(new Error('duration failed')));
    child.on('close', () => finish());

    function finish(error?: Error): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      if (error) {
        reject(error);
        return;
      }
      resolve(parseDuration(stderr));
    }
  });
}

function parseDuration(stderr: string): number {
  const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!match) return Number.NaN;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function compressClip(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const command = ffmpeg(input).duration(EVALUATOR_CLIP_SECONDS).fps(10).size('?x480').output(output);
    const timer = setTimeout(() => finish(new Error('compress timeout')), EVALUATOR_FFMPEG_TIMEOUT_MS);
    command
      .on('end', () => finish())
      .on('error', () => finish(new Error('compress failed')))
      .run();

    function finish(error?: Error): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        command.kill('SIGKILL');
        reject(error);
        return;
      }
      resolve();
    }
  });
}

async function removeTemp(filePath: string): Promise<void> {
  await fs.promises.rm(filePath, { force: true });
}
