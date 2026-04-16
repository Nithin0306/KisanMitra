import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity,
  NativeSyntheticEvent, NativeScrollEvent, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown, FadeIn,
  useAnimatedStyle, useSharedValue,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { useAppContext } from '../context/AppContext';
import { useStrings } from '../utils/language';
import { LanguageSelector } from '../components/LanguageSelector';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.55; // Hero image takes up 55% of screen height

const FEATURES = [
  {
    emoji: '🗣️',
    step: '01',
    title: 'Speak in Any Language',
    desc: 'KisanMitra understands Hindi, Tamil, Telugu, Kannada, Marathi, and Punjabi. Just tap and talk — no typing, no menus.',
    cardBg: '#E8F5E9',
    accentColor: '#2E7D32',
    stepColor: '#A5D6A7',
  },
  {
    emoji: '🌱',
    step: '02',
    title: 'Get the Right Crop',
    desc: 'We fetch live 14-day weather forecasts and combine them with your soil type to recommend the top 3 safest, most profitable crops.',
    cardBg: '#E3F2FD',
    accentColor: '#1565C0',
    stepColor: '#90CAF9',
  },
  {
    emoji: '📈',
    step: '03',
    title: 'Sell at the Right Time',
    desc: 'Live market prices from Agmarknet. We compute 3-day and 7-day moving averages and tell you exactly: SELL, WAIT, or HOLD.',
    cardBg: '#FFF8E1',
    accentColor: '#E65100',
    stepColor: '#FFCC80',
  },
  {
    emoji: '🏛️',
    step: '04',
    title: 'Find Govt Schemes for You',
    desc: "Instantly matched to your state, crop, and land size. We surface government schemes you're eligible for — no forms, just answers.",
    cardBg: '#F3E5F5',
    accentColor: '#6A1B9A',
    stepColor: '#CE93D8',
  },
];

type Feature = typeof FEATURES[0];

const StorySlide = ({
  feature, scrollX, index,
}: { feature: Feature; scrollX: Animated.SharedValue<number>; index: number }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.88, 1, 0.88], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[styles.slide, { width }, animatedStyle]}>
      <View style={[styles.slideCard, { backgroundColor: feature.cardBg }]}>
        <Text style={[styles.stepBadge, { color: feature.stepColor }]}>{feature.step}</Text>
        <Text style={styles.slideEmoji}>{feature.emoji}</Text>
        <Text style={[styles.slideTitle, { color: feature.accentColor }]}>{feature.title}</Text>
        <Text style={styles.slideDesc}>{feature.desc}</Text>
        <View style={[styles.accentBar, { backgroundColor: feature.accentColor }]} />
      </View>
    </Animated.View>
  );
};

export function LandingScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const s = useStrings(state.language);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Feature slides — translated
  const FEATURES = [
    { emoji: '🗣️', step: '01', title: s.feat1Title, desc: s.feat1Desc, cardBg: '#E8F5E9', accentColor: '#2E7D32', stepColor: '#1ca621ff' },
    { emoji: '🌱', step: '02', title: s.feat2Title, desc: s.feat2Desc, cardBg: '#E3F2FD', accentColor: '#1565C0', stepColor: '#4387beff' },
    { emoji: '📈', step: '03', title: s.feat3Title, desc: s.feat3Desc, cardBg: '#FFF8E1', accentColor: '#E65100', stepColor: '#e6a84aff' },
    { emoji: '🏛️', step: '04', title: s.feat4Title, desc: s.feat4Desc, cardBg: '#F3E5F5', accentColor: '#6A1B9A', stepColor: '#bb5bccff' },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(newIndex);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero Image Section ── */}
        <ImageBackground
          source={require('../../assets/images/Farmer Wallpaper Top Background.jpg')}
          style={styles.heroBg}
          imageStyle={styles.heroBgImage}
          resizeMode="cover"
        >
          {/* Dark gradient scrim so white text is always readable */}
          <View style={styles.scrim} />

          {/* Language selector floats at the top of the hero */}
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.langSelectorOnHero}>
            <LanguageSelector />
          </Animated.View>

          {/* Content overlaid on the image */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{s.landingBadge}</Text>
            </View>
            <Text style={styles.title}>
              {s.landingTitle}<Text style={styles.titleHighlight}>{s.landingTitleHighlight}</Text>
            </Text>
            <Text style={styles.subtitle}>{s.landingSubtitle}</Text>
          </Animated.View>
        </ImageBackground>

        {/* ── Below-the-fold: Section label + Scrollytelling ── */}
        <View style={styles.belowFold}>

          {/* Section label */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>{s.landingHowLabel.toUpperCase()}</Text>
            <Text style={styles.sectionLabelHint}>{s.landingSwipeHint}</Text>
          </Animated.View>

          {/* Horizontal story scroller */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {FEATURES.map((feat, idx) => (
              <StorySlide key={idx} feature={feat} scrollX={scrollX} index={idx} />
            ))}
          </ScrollView>

          {/* Dot indicators */}
          <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.dotsContainer}>
            {FEATURES.map((_, idx) => (
              <View key={idx} style={[styles.dot, activeIndex === idx && styles.dotActive]} />
            ))}
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeIn.delay(700).duration(800)} style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.8}
              onPress={() => router.push('/voice' as any)}
            >
              <Text style={styles.ctaText}>{s.landingCta}</Text>
            </TouchableOpacity>
            <Text style={styles.ctaSubtext}>{s.landingCtaSub}</Text>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F9F6' },
  scrollContent: { flexGrow: 1 },

  // ── Hero with Background Image ──
  heroBg: {
    width: '100%',
    height: HERO_HEIGHT,
    justifyContent: 'flex-end', // push content to bottom of image
  },
  heroBgImage: {
    // object-position: top so we see the sky/farmscape
  },
  // Dark gradient-like scrim at the bottom half of the image for readability
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // A simple dark overlay fading from transparent at top to dark at bottom
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  langSelectorOnHero: {
    paddingTop: 12,
    // Filter pills need to stand out on the dark photo
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleHighlight: {
    color: '#A5D6A7', // soft lime-green against the dark scrim
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
    fontWeight: '500',
  },

  // ── Below-fold container ──
  belowFold: {
    paddingTop: 28,
    paddingBottom: 60,
    backgroundColor: '#F5F9F6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28, // pull up slightly over the image for an overlap effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },

  // Section label
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionLabelText: { fontSize: 11, fontWeight: '800', color: '#90A4AE', letterSpacing: 2 },
  sectionLabelHint: { fontSize: 11, color: '#B0BEC5', fontWeight: '500' },

  // Story slides
  slide: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  slideCard: {
    width: '100%', borderRadius: 28, padding: 28, minHeight: 260,
    justifyContent: 'flex-start', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.50, shadowRadius: 24, elevation: 10,
  },
  stepBadge: {
    fontSize: 48, fontWeight: '900',
    position: 'absolute', top: 16, right: 20, letterSpacing: -2,
  },
  slideEmoji: { fontSize: 52, marginBottom: 20 },
  slideTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5, lineHeight: 30 },
  slideDesc: { fontSize: 15, lineHeight: 23, color: '#546E7A', fontWeight: '500' },
  accentBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 20, marginBottom: 8, gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CFD8DC' },
  dotActive: { width: 20, backgroundColor: '#2E7D32', borderRadius: 3 },

  // CTA
  ctaContainer: { marginTop: 20, alignItems: 'center', paddingHorizontal: 24 },
  ctaButton: {
    backgroundColor: '#1B5E20', width: '100%', paddingVertical: 18, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  ctaSubtext: { marginTop: 12, fontSize: 12, color: '#90A4AE', fontWeight: '500' },
});
