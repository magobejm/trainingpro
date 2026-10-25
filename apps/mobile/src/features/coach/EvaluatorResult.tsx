import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CoachPdfButton } from './CoachPdfButton';
import { ui } from './CoachUi';
import type { CoachTechniqueResult } from './coach-evaluator-model';

export function EvaluatorResult({ result }: { result: CoachTechniqueResult }) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  const sections = [
    { title: en ? 'Immediate correction' : 'Corrección inmediata', lines: [result.correccion_inmediata] },
    { title: en ? 'Detected errors' : 'Errores detectados', lines: result.errores_detectados },
    {
      title: en ? 'Key points' : 'Puntos clave',
      lines: [
        (en ? 'Back: ' : 'Espalda: ') + result.analisis_puntos_clave.espalda,
        (en ? 'Range of motion: ' : 'Rango de movimiento: ') + result.analisis_puntos_clave.rango_movimiento,
        (en ? 'Joint alignment: ' : 'Alineación articular: ') + result.analisis_puntos_clave.alineacion_articulaciones,
      ],
    },
  ];
  return (
    <View style={ui.field}>
      <Text style={ui.title}>{result.ejercicio}</Text>
      <Text style={ui.text}>{result.fase_movimiento}</Text>
      <Text style={result.score_seguridad < 50 ? ui.error : ui.label}>
        {(en ? 'Safety score: ' : 'Puntuación de seguridad: ') + result.score_seguridad + '/100'}
      </Text>
      {sections.map((section) => (
        <View key={section.title} style={ui.card}>
          <Text style={ui.label}>{section.title}</Text>
          {section.lines.map((line, index) => (
            <Text key={index} style={ui.text}>
              {line}
            </Text>
          ))}
        </View>
      ))}
      <CoachPdfButton title={result.ejercicio} sections={sections} />
    </View>
  );
}
