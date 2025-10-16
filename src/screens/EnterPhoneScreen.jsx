import React, {useMemo, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CountryPicker, {Flag} from 'react-native-country-picker-modal';
import {useError} from '../context/ErrorContext';

function formatPhone(digits) {
    const only = (digits || '').replace(/\D+/g, '');
    return only
        .replace(/(.{2})/g, '$1 ')
        .trim(); // simple group by 2 (visuel FR-like)
}

export default function EnterPhoneScreen({navigation}) {
    const {showError} = useError();
    const [cca2, setCca2] = useState('FR');
    const [callingCode, setCallingCode] = useState('33');
    const [raw, setRaw] = useState('');

    const formatted = useMemo(() => formatPhone(raw), [raw]);
    const canContinue = raw
        .replace(/\D+/g, '')
        .length >= 6; // évite les envois vides

    const onSelect = (c) => {
        setCca2(c.cca2);
        const code = Array.isArray(c.callingCode)
            ? c.callingCode[0]
            : c.callingCode;
        setCallingCode(code || '');
    };

    const onContinue = () => {
        if (!canContinue) {
            showError('Enter a valid phone number', {position: 'top'});
            return;
        }
        const e164 = `+${callingCode}${raw.replace(/\D+/g, '')}`;
        navigation.navigate('VerifyCode', {
            phoneDisplay: `+${callingCode} ${formatted}`,
            e164
        });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={{
                    flex: 1
                }}
                behavior={Platform.OS === 'ios'
                    ? 'padding'
                    : undefined}>
                <View style={styles.container}>
                    {/* Handle */}
                    <View style={styles.handleWrap}><View style={styles.handle}/></View>

                    {/* Title */}
                    <View
                        style={{
                            paddingHorizontal: 24
                        }}>
                        <Text style={styles.title}>Enter your phone number</Text>
                        <Text style={styles.subtitle}>Enter your phone number below to create your account.</Text>
                    </View>

                    {/* Phone field */}
                    <View
                        style={{
                            paddingHorizontal: 24,
                            marginTop: 16
                        }}>
                        <View style={styles.phoneField}>
                            <TouchableOpacity style={styles.codeBox} activeOpacity={0.8}>
                                <Flag
                                    countryCode={cca2}
                                    withEmoji={false}
                                    style={{
                                        marginRight: 8
                                    }}/>
                                <Text style={styles.codeText}>+{callingCode}</Text>
                                <CountryPicker
                                    countryCode={cca2}
                                    withFlag="withFlag"
                                    withFilter="withFilter"
                                    withCallingCode="withCallingCode"
                                    withAlphaFilter="withAlphaFilter"
                                    withCountryNameButton={false}
                                    onSelect={onSelect}
                                    containerButtonStyle={styles.pickerHitbox}/>
                            </TouchableOpacity>

                            <View style={styles.divider}/>

                            <TextInput
                                value={formatted}
                                onChangeText={(t) => setRaw(t)}
                                keyboardType="phone-pad"
                                placeholder="Phone number"
                                placeholderTextColor="#9CA3AF"
                                style={styles.phoneInput}/>
                        </View>
                    </View>

                    <View style={{
                            flex: 1
                        }}/> {/* Bottom button + footer */}
                    <View style={styles.bottom}>
                        <TouchableOpacity
                            onPress={onContinue}
                            activeOpacity={0.9}
                            disabled={!canContinue}
                            style={[
                                styles.cta, !canContinue && styles.ctaDisabled
                            ]}>
                            <Text
                                style={[
                                    styles.ctaText, !canContinue && styles.ctaTextDisabled
                                ]}>Continue</Text>
                        </TouchableOpacity>

                        <Text style={styles.footerText}>
                            Do you have an account ?{' '}
                            <Text
                                onPress={() => navigation.navigate('ChooseTag')}
                                style={styles.footerLink}>Log in</Text>
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff'
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 16
    },
    handleWrap: {
        alignItems: 'center',
        marginBottom: 24
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2
    },

    title: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280'
    },

    phoneField: {
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    codeBox: {
        paddingHorizontal: 12,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    codeText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600'
    },
    pickerHitbox: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    }, // ouvre le modal au toucher
    divider: {
        width: 1,
        height: '70%',
        backgroundColor: '#E5E7EB'
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#111827'
    },

    bottom: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        alignItems: 'center'
    },
    cta: {
        height: 52,
        borderRadius: 16,
        backgroundColor: '#111111',
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    ctaDisabled: {
        backgroundColor: '#E5E7EB'
    },
    ctaText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16
    },
    ctaTextDisabled: {
        color: '#9CA3AF'
    },
    footerText: {
        color: '#6B7280',
        fontSize: 13
    },
    footerLink: {
        color: '#111111',
        fontWeight: '600'
    }
});