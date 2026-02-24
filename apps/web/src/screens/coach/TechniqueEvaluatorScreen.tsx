/* eslint-disable max-lines, max-lines-per-function, no-restricted-syntax, max-len */
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

import { useAnalyzeTechniqueMutation } from '../../data/hooks/ai/useAnalyzeTechniqueMutation';

export function TechniqueEvaluatorScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const analyzeMutation = useAnalyzeTechniqueMutation();

    const onDrop = (acceptedFiles: File[]) => {
        const firstFile = acceptedFiles[0];
        if (firstFile) {
            setFile(firstFile);
            setFileUrl(URL.createObjectURL(firstFile));
            analyzeMutation.reset();
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'video/*': ['.mp4', '.mov', '.webm']
        },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            await analyzeMutation.mutateAsync({ file });
        } catch (e) {
            console.error("Error analyzing", e);
        }
    };

    if (analyzeMutation.isSuccess && analyzeMutation.data && fileUrl) {
        const fileIsVideo = file ? file.type.startsWith('video/') : false;
        return <ResultsView
            result={analyzeMutation.data}
            onReset={() => { setFile(null); setFileUrl(null); analyzeMutation.reset(); }}
            fileUrl={fileUrl}
            isVideo={fileIsVideo}
            t={t}
        />;
    }

    if (analyzeMutation.isPending || isUploading) {
        return <EntertainingLoader />;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{t('app.evaluator.title', 'Evaluador de Técnica Biomecánica')}</Text>
            <Text style={styles.subtitle}>
                {t('app.evaluator.subtitle', 'Sube un video corto (máx 30s) o imagen de un ejercicio para que nuestra IA especializada identifique errores posturales y brinde correcciones de seguridad inmediatas.')}
            </Text>

            <div
                {...getRootProps()}
                style={Object.assign({}, stylesHtml.dropzone, isDragActive && stylesHtml.dropzoneActive)}
            >
                <input {...getInputProps()} />
                {fileUrl && file ? (
                    file.type.startsWith('video/') ? (
                        <video src={fileUrl} style={stylesHtml.previewMedia} controls muted />
                    ) : (
                        <img src={fileUrl} style={stylesHtml.previewMedia} alt="Preview" />
                    )
                ) : (
                    <View style={styles.dropZoneContent}>
                        <Text style={styles.dropZoneIcon}>{"\u2601\uFE0F"}</Text>
                        <Text style={styles.dropZoneTitle}>{t('app.evaluator.dropHere', 'Arrastra y suelta tu archivo aquí')}</Text>
                        <Text style={styles.dropZoneHint}>{t('app.evaluator.dropHint', 'o haz clic para seleccionar (MP4, MOV, JPG, PNG)')}</Text>
                    </View>
                )}
            </div>

            <View style={styles.actionsBox}>
                <Pressable style={styles.analyzeButton} onPress={() => void handleAnalyze()}>
                    <Text style={styles.analyzeLabel}>{t('app.evaluator.analyzeAction', 'Analizar Técnica con Gemini IA \u2728')}</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const MESSAGES = [
    "Analizando cinemática del movimiento...",
    "Evaluando alineación de articulaciones...",
    "Consultando modelos biomecánicos predictivos...",
    "Verificando curvatura espinal y estrés lumbar...",
    "Calculando Score de Seguridad...",
    "Preparando correcciones inmediatas..."
];

function EntertainingLoader() {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 2800);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5 }}
                    style={stylesHtml.motionWrapper}
                >
                    <Text style={styles.loaderText}>{MESSAGES[index]}</Text>
                </motion.div>
            </AnimatePresence>
            <Text style={styles.loaderSubtext}>{t('app.evaluator.waitSubtext', 'Este proceso puede demorar hasta 30 segundos.')}</Text>
        </View>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResultsView({ result, onReset, fileUrl, isVideo, t }:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { result: any, onReset: () => void, fileUrl: string, isVideo: boolean, t: any }
) {
    const isDanger = result.score_seguridad < 50;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={[styles.resultCard, isDanger && styles.resultCardDanger]}>
                <View style={styles.resultHeader}>
                    <View>
                        <Text style={styles.resultTitle}>
                            {result.ejercicio} ({result.fase_movimiento})
                        </Text>
                        <Text style={[
                            styles.scoreTag,
                            isDanger ? styles.scoreTagDanger : styles.scoreTagSafe
                        ]}>
                            {t('app.evaluator.scoreLabel', 'Score de Seguridad:')} {result.score_seguridad}/100
                        </Text>
                    </View>
                    <Pressable onPress={onReset} style={styles.resetButton}>
                        <Text style={styles.resetLabel}>{t('app.evaluator.resetAction', 'Evaluar otro')}</Text>
                    </Pressable>
                </View>

                <View style={styles.mediaRow}>
                    {isVideo ? (
                        <video src={fileUrl} style={stylesHtml.resultMedia} controls muted />
                    ) : (
                        <img src={fileUrl} style={stylesHtml.resultMedia} alt="Preview" />
                    )}
                    <View style={styles.correctionBanner}>
                        <Text style={styles.correctionTitle}>{t('app.evaluator.correctionTitle', '\uD83D\uDCA1 Corrección Inmediata')}</Text>
                        <Text style={styles.correctionText}>{result.correccion_inmediata}</Text>
                    </View>
                </View>

                <View style={styles.detailsGrid}>
                    <View style={styles.detailList}>
                        <Text style={styles.detailTitle}>{t('app.evaluator.errorsTitle', '\u26A0\uFE0F Errores Detectados')}</Text>
                        {result.errores_detectados.map((e: string, i: number) => (
                            <Text key={i} style={styles.detailItem}>• {e}</Text>
                        ))}
                    </View>
                    <View style={styles.detailList}>
                        <Text style={styles.detailTitle}>{t('app.evaluator.pointsTitle', '\uD83D\uDD0D Puntos Clave')}</Text>
                        <Text style={styles.detailItem}>{t('app.evaluator.backLabel', 'Espalda:')} {result.analisis_puntos_clave.espalda}</Text>
                        <Text style={styles.detailItem}>{t('app.evaluator.rangeLabel', 'Rango:')} {result.analisis_puntos_clave.rango_movimiento}</Text>
                        <Text style={styles.detailItem}>{t('app.evaluator.jointsLabel', 'Articulaciones:')} {result.analisis_puntos_clave.alineacion_articulaciones}</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const stylesHtml = {
    dropzone: {
        border: '2px dashed #3b4f70',
        borderRadius: '16px',
        backgroundColor: '#111a27',
        padding: '40px',
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'border .24s ease-in-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '260px'
    },
    dropzoneActive: {
        borderColor: '#4285F4',
        backgroundColor: '#162438'
    },
    previewMedia: {
        maxHeight: '240px',
        maxWidth: '100%',
        borderRadius: '8px',
        objectFit: 'contain' as const
    },
    resultMedia: {
        width: '300px',
        height: '240px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        backgroundColor: '#000'
    },
    motionWrapper: {
        marginTop: 20,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flexGrow: 1,
        gap: 20
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff'
    },
    subtitle: {
        fontSize: 15,
        color: '#9aa5b1',
        lineHeight: 22,
        maxWidth: 700
    },
    dropZoneContent: {
        alignItems: 'center',
        gap: 8
    },
    dropZoneIcon: {
        fontSize: 48,
        marginBottom: 8
    },
    dropZoneTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600'
    },
    dropZoneHint: {
        color: '#5f6f84',
        fontSize: 14
    },
    actionsBox: {
        alignItems: 'center',
        marginTop: 10
    },
    analyzeButton: {
        backgroundColor: '#4285F4',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#4285F4',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    analyzeLabel: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 16
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0b1118'
    },
    loaderText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center'
    },
    loaderSubtext: {
        color: '#5f6f84',
        fontSize: 13,
        marginTop: 16
    },
    resultCard: {
        backgroundColor: '#111a27',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#1e2a3a',
        gap: 20
    },
    resultCardDanger: {
        borderColor: '#ef4444',
        backgroundColor: '#1f1317' // Subtle red tint
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 6
    },
    scoreTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
        fontWeight: '700',
        fontSize: 13,
        alignSelf: 'flex-start'
    },
    scoreTagSafe: {
        backgroundColor: '#10b98120',
        color: '#10b981'
    },
    scoreTagDanger: {
        backgroundColor: '#ef444420',
        color: '#ef4444'
    },
    resetButton: {
        backgroundColor: '#1e2a3a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    resetLabel: {
        color: '#dce8ff',
        fontWeight: '600',
        fontSize: 13
    },
    mediaRow: {
        flexDirection: 'row',
        gap: 20,
        flexWrap: 'wrap'
    },
    correctionBanner: {
        flex: 1,
        minWidth: 300,
        backgroundColor: '#f59e0b15',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        padding: 20,
        borderRadius: 12,
        justifyContent: 'center'
    },
    correctionTitle: {
        color: '#fbbf24',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 8
    },
    correctionText: {
        color: '#fef3c7',
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 26
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        marginTop: 10,
        backgroundColor: '#0b1118',
        padding: 20,
        borderRadius: 12
    },
    detailList: {
        flex: 1,
        minWidth: 250,
        gap: 8
    },
    detailTitle: {
        color: '#9aa5b1',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4
    },
    detailItem: {
        color: '#dce8ff',
        fontSize: 14,
        lineHeight: 22
    }
});
