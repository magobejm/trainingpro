/* eslint-disable max-lines-per-function, max-len, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const ffmpeg = require('fluent-ffmpeg');

// Configurar ffmpeg con el binario embebido
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class AnalyzeTechniqueUseCase {
  private readonly ai: GoogleGenAI | null;

  constructor() {
    this.ai = createAiClient();
  }

  async execute(file: Express.Multer.File, exerciseName?: string) {
    if (!file) {
      throw new BadRequestException('Se requiere archivo multimedia (imagen o video)');
    }

    if (!this.ai) {
      throw new BadRequestException('API Key de Gemini no configurada');
    }

    const { mimeType, contentBase64 } = await this.prepareMedia(file);

    const prompt = this.buildPrompt(exerciseName);

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: contentBase64,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.getSchema(),
      },
    });

    try {
      if (response.text) {
        return JSON.parse(response.text);
      }
      throw new Error('Sin respuesta');
    } catch (error) {
      throw new BadRequestException('Error al parsear JSON del modelo evaluador', {
        cause: error,
      });
    }
  }

  private async prepareMedia(
    file: Express.Multer.File,
  ): Promise<{ mimeType: string; contentBase64: string }> {
    const isVideo = file.mimetype.startsWith('video/');

    if (!isVideo) {
      // Es imagen, la enviamos directamente
      return {
        mimeType: file.mimetype,
        contentBase64: file.buffer.toString('base64'),
      };
    }

    // Es video, extraemos el clip condensado para no colapsar la IA ni exceder límites
    return this.compressVideo(file);
  }

  private compressVideo(
    file: Express.Multer.File,
  ): Promise<{ mimeType: string; contentBase64: string }> {
    return new Promise((resolve, reject) => {
      const tempInput = path.join(os.tmpdir(), `eval_in_${Date.now()}.mp4`);
      const tempOutput = path.join(os.tmpdir(), `eval_out_${Date.now()}.mp4`);

      fs.writeFileSync(tempInput, file.buffer);

      ffmpeg(tempInput)
        .duration(10) // Tomar máximo los primeros 10 segundos
        .fps(10) // Reducir a 10 fps (suficiente para análisis biomecánico rápido)
        .size('?x480') // Reducir alto para ahorrar tokens
        .output(tempOutput)
        .on('end', () => {
          const outBuffer = fs.readFileSync(tempOutput);
          fs.unlinkSync(tempInput);
          fs.unlinkSync(tempOutput);
          resolve({
            mimeType: 'video/mp4',
            contentBase64: outBuffer.toString('base64'),
          });
        })
        .on('error', (err: Error) => {
          if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          reject(new BadRequestException(`Error procesando video: ${err.message}`));
        })
        .run();
    });
  }

  private buildPrompt(exerciseName?: string): string {
    const defaultText =
      `Actúa como un preparador físico experto. ` +
      `Analiza este contenido multimedia del usuario realizando un ejercicio y devuelve ` +
      `exclusivamente un objeto JSON que evalúe la postura basándote en estándares de seguridad biomecánica.`;
    if (exerciseName) {
      return `${defaultText} El ejercicio que se está intentando ejecutar es: "${exerciseName}".`;
    }
    return defaultText;
  }

  private getSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        ejercicio: { type: Type.STRING },
        fase_movimiento: { type: Type.STRING },
        analisis_puntos_clave: {
          type: Type.OBJECT,
          properties: {
            espalda: { type: Type.STRING },
            rango_movimiento: { type: Type.STRING },
            alineacion_articulaciones: { type: Type.STRING },
          },
        },
        errores_detectados: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        correccion_inmediata: { type: Type.STRING },
        score_seguridad: { type: Type.INTEGER },
      },
      required: [
        'ejercicio',
        'fase_movimiento',
        'analisis_puntos_clave',
        'errores_detectados',
        'correccion_inmediata',
        'score_seguridad',
      ],
    };
  }
}

function createAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}
